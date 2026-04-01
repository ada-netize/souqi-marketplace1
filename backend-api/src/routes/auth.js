const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../lib/db");
const { signToken, requireAuth } = require("../lib/auth");
const { now, addDays, normalizeEmail, isValidEmail, normalizePhone, isValidPhone } = require("../lib/utils");

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    city_id: user.city_id,
    avatar: user.avatar,
    role: "user",
    account_type: user.account_type || "user",
    subscription_plan: user.subscription_plan || "free",
    subscription_status: user.subscription_status || "inactive",
    subscription_expires_at: user.subscription_expires_at || null,
    trusted_badge: Number(user.trusted_badge || 0),
    is_verified: user.is_verified,
    is_blocked: user.is_blocked,
  };
}

router.post("/register", (req, res) => {
  const fullName = String(req.body?.fullName || "").trim();
  const email = normalizeEmail(req.body?.email || "");
  const password = String(req.body?.password || "");
  const phone = normalizePhone(req.body?.phone || "");
  const cityId = req.body?.cityId || null;

  if (!fullName || !password || !email || !phone) {
    return res.status(400).json({ message: "الاسم والبريد الإلكتروني وكلمة المرور ورقم الهاتف مطلوبة" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "أدخل بريدًا إلكترونيًا صحيحًا" });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: "أدخل رقم جوال صحيحًا بالأرقام فقط" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ? OR phone = ?").get(email, phone);
  if (existing) return res.status(400).json({ message: "المستخدم موجود مسبقًا" });

  const hash = bcrypt.hashSync(password, 10);

  const info = db.prepare(`
    INSERT INTO users (
      full_name, email, password_hash, phone, city_id,
      role, seller_status, account_type, subscription_plan, subscription_status, trusted_badge, created_at
    )
    VALUES (?, ?, ?, ?, ?, 'user', 'active', 'user', 'free', 'inactive', 0, ?)
  `).run(fullName, email, hash, phone, cityId, now());

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = signToken({ id: user.id, role: "user", email: user.email, phone: user.phone });
  res.json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const email = normalizeEmail(req.body?.email || "");
  const password = String(req.body?.password || "");

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "أدخل بريدًا إلكترونيًا صحيحًا" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !user.password_hash) return res.status(400).json({ message: "بيانات الدخول غير صحيحة" });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(400).json({ message: "بيانات الدخول غير صحيحة" });
  if (user.is_blocked) return res.status(403).json({ message: "الحساب محظور" });

  const token = signToken({ id: user.id, role: "user", email: user.email, phone: user.phone });
  res.json({ token, user: publicUser(user) });
});

router.post("/send-otp", (req, res) => {
  const phone = normalizePhone(req.body?.phone || "");
  const purpose = String(req.body?.purpose || "login");
  if (!isValidPhone(phone)) return res.status(400).json({ message: "رقم الهاتف مطلوب وبصيغة صحيحة" });
  const code = String(Math.floor(1000 + Math.random() * 9000));
  db.prepare("UPDATE otp_codes SET is_used = 1 WHERE phone = ? AND purpose = ? AND is_used = 0").run(phone, purpose);
  db.prepare(`INSERT INTO otp_codes (phone, code, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(phone, code, purpose, addDays(now(), 1 / 24), now());

  res.json({ ok: true, devCode: code, message: "تم إنشاء كود محلي للتجربة" });
});

router.post("/verify-otp", (req, res) => {
  const phone = normalizePhone(req.body?.phone || "");
  const code = String(req.body?.code || "").trim();
  const fullName = String(req.body?.fullName || "").trim();
  const cityId = req.body?.cityId || null;
  if (!isValidPhone(phone) || !code) return res.status(400).json({ message: "البيانات ناقصة أو غير صحيحة" });

  const row = db.prepare(`
    SELECT * FROM otp_codes
    WHERE phone = ? AND code = ? AND is_used = 0
    ORDER BY id DESC LIMIT 1
  `).get(phone, code);

  if (!row) return res.status(400).json({ message: "الكود غير صحيح" });
  if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ message: "انتهت صلاحية الكود" });

  db.prepare("UPDATE otp_codes SET is_used = 1 WHERE id = ?").run(row.id);

  let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
  if (!user) {
    if (!fullName) return res.status(400).json({ message: "هذا الرقم غير مسجل. أرسل الاسم لإنشاء الحساب." });
    const info = db.prepare(`
      INSERT INTO users (
        full_name, email, password_hash, phone, city_id,
        role, seller_status, account_type, subscription_plan, subscription_status, trusted_badge, is_verified, created_at
      )
      VALUES (?, NULL, NULL, ?, ?, 'user', 'active', 'user', 'free', 'inactive', 0, 1, ?)
    `).run(fullName, phone, cityId, now());
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  }

  if (user.is_blocked) return res.status(403).json({ message: "الحساب محظور" });

  const token = signToken({ id: user.id, role: "user", email: user.email, phone: user.phone });
  res.json({ token, user: publicUser(user) });
});

router.post("/admin/login", (req, res) => {
  const email = normalizeEmail(req.body?.email || "");
  const password = String(req.body?.password || "");
  const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);
  if (!admin) return res.status(400).json({ message: "بيانات الأدمن غير صحيحة" });
  const ok = bcrypt.compareSync(password, admin.password_hash);
  if (!ok) return res.status(400).json({ message: "بيانات الأدمن غير صحيحة" });

  const token = signToken({ id: admin.id, role: "admin", email: admin.email });
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
});

router.get("/me", requireAuth("user"), (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.auth.id);
  res.json(publicUser(user));
});

router.get("/admin/me", requireAuth("admin"), (req, res) => {
  const admin = db.prepare("SELECT id, name, email FROM admins WHERE id = ?").get(req.auth.id);
  res.json(admin);
});

module.exports = router;
