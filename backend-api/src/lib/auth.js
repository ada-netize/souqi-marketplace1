const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { db } = require("./db");

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function loadPrincipal(role, id) {
  if (role === "admin") {
    return db.prepare("SELECT id, name, email FROM admins WHERE id = ?").get(id) || null;
  }

  const user = db.prepare(`
    SELECT id, full_name, email, phone, city_id, avatar, role, account_type,
           subscription_plan, subscription_status, subscription_expires_at,
           trusted_badge, is_verified, is_blocked
    FROM users
    WHERE id = ?
  `).get(id);

  return user || null;
}

function requireAuth(role = "user") {
  return (req, res, next) => {
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ message: "غير مصرح" });

      const decoded = verifyToken(token);
      if (role && decoded.role !== role) {
        return res.status(403).json({ message: "لا تملك الصلاحية" });
      }

      const principal = loadPrincipal(decoded.role, decoded.id);
      if (!principal) {
        return res.status(401).json({ message: "المستخدم غير موجود" });
      }

      if (decoded.role === "user" && Number(principal.is_blocked || 0) === 1) {
        return res.status(403).json({ message: "تم حظر هذا الحساب" });
      }

      req.auth = decoded;
      if (decoded.role === "admin") req.admin = principal;
      if (decoded.role === "user") req.user = principal;
      next();
    } catch (error) {
      return res.status(401).json({ message: "الجلسة غير صالحة" });
    }
  };
}

module.exports = { signToken, verifyToken, requireAuth };
