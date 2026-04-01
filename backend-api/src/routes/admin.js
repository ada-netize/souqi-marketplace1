const express = require("express");
const { db } = require("../lib/db");
const { requireAuth } = require("../lib/auth");
const { now, tryParseJSON } = require("../lib/utils");
const { upload } = require("../middleware/upload");
const { getSettingsObject, upsertSetting, mapListing, listingOrderSql } = require("../lib/marketplace");

const router = express.Router();
router.use(requireAuth("admin"));

function purchaseAsTransaction(row) {
  return {
    id: row.id,
    listing_id: row.listing_id,
    seller_user_id: row.user_id,
    buyer_user_id: null,
    amount: Number(row.amount || 0),
    commission_percent: 100,
    commission_amount: Number(row.amount || 0),
    seller_amount: 0,
    store_manager_amount: Number(row.amount || 0),
    status: row.status,
    created_at: row.created_at,
    product_key: row.product_key,
    product_type: row.product_type,
    plan_key: row.plan_key,
    store: row.store,
    listing_title: row.listing_title,
    seller_name: row.user_name,
  };
}

router.get("/dashboard", (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  const totalListings = db.prepare("SELECT COUNT(*) as count FROM listings").get().count;
  const featuredListings = db.prepare("SELECT COUNT(*) as count FROM listings WHERE is_featured = 1").get().count;
  const reports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'open'").get().count;
  const newListings = db.prepare("SELECT COUNT(*) as count FROM listings WHERE date(created_at) = date('now')").get().count;
  const soldListings = db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 'sold'").get().count;
  const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status IN ('open','reviewing')").get().count;
  const totalMessages = db.prepare("SELECT COUNT(*) as count FROM messages").get().count;
  const activeBoosts = db.prepare("SELECT COUNT(*) as count FROM listings WHERE boost_expires_at IS NOT NULL AND datetime(boost_expires_at) > datetime('now')").get().count;
  const homeSponsors = db.prepare("SELECT COUNT(*) as count FROM listings WHERE sponsor_home_expires_at IS NOT NULL AND datetime(sponsor_home_expires_at) > datetime('now')").get().count;
  const commissions = db.prepare("SELECT IFNULL(SUM(amount), 0) as total FROM digital_purchases WHERE status = 'applied'").get().total;
  const activeSubscriptions = db.prepare("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active'").get().count;

  const topCities = db.prepare(`SELECT c.name_ar, COUNT(l.id) AS count FROM listings l JOIN cities c ON c.id = l.city_id GROUP BY l.city_id ORDER BY count DESC LIMIT 5`).all();
  const topCategories = db.prepare(`SELECT c.name_ar, COUNT(l.id) AS count FROM listings l JOIN categories c ON c.id = l.category_id GROUP BY l.category_id ORDER BY count DESC LIMIT 5`).all();
  const latestActivities = [
    ...db.prepare("SELECT 'listing' as type, title as label, created_at FROM listings ORDER BY created_at DESC LIMIT 4").all(),
    ...db.prepare("SELECT 'report' as type, reason as label, created_at FROM reports ORDER BY created_at DESC LIMIT 4").all(),
    ...db.prepare("SELECT 'message' as type, message as label, created_at FROM messages ORDER BY created_at DESC LIMIT 4").all(),
    ...db.prepare("SELECT 'promotion' as type, product_key as label, created_at FROM digital_purchases ORDER BY created_at DESC LIMIT 4").all(),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 10);

  res.json({
    stats: { totalUsers, totalListings, featuredListings, reports, newListings, soldListings, pendingReports, totalMessages, activeBoosts, homeSponsors, activeSubscriptions, commissions },
    topCities,
    topCategories,
    latestActivities,
  });
});

router.get("/listings", (req, res) => {
  const q = req.query.q || "";
  const status = req.query.status || "";
  const rows = db.prepare(`
    SELECT l.*, u.full_name as user_name, c.name_ar as city_name, cat.name_ar as category_name
    FROM listings l
    JOIN users u ON u.id = l.user_id
    JOIN cities c ON c.id = l.city_id
    JOIN categories cat ON cat.id = l.category_id
    WHERE (l.title LIKE ? OR l.description LIKE ?)
      AND (? = '' OR l.status = ?)
    ORDER BY ${listingOrderSql("l")}
  `).all(`%${q}%`, `%${q}%`, status, status);
  res.json(rows.map(mapListing));
});

router.get("/listings/:id", (req, res) => {
  const row = db.prepare(`
    SELECT l.*, u.full_name as user_name, u.phone as user_phone, c.name_ar as city_name, cat.name_ar as category_name
    FROM listings l
    JOIN users u ON u.id = l.user_id
    JOIN cities c ON c.id = l.city_id
    JOIN categories cat ON cat.id = l.category_id
    WHERE l.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ message: "الإعلان غير موجود" });
  const listing = mapListing(row);
  const reports = db.prepare("SELECT * FROM reports WHERE target_type = 'listing' AND target_id = ? ORDER BY created_at DESC").all(req.params.id);
  const transactions = db.prepare(`
    SELECT dp.*, l.title as listing_title, u.full_name as user_name
    FROM digital_purchases dp
    LEFT JOIN listings l ON l.id = dp.listing_id
    LEFT JOIN users u ON u.id = dp.user_id
    WHERE dp.listing_id = ?
    ORDER BY dp.created_at DESC
  `).all(req.params.id).map(purchaseAsTransaction);
  const boosts = db.prepare("SELECT * FROM boost_subscriptions WHERE listing_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json({ listing, reports, transactions, boosts });
});

router.put("/listings/:id", (req, res) => {
  const { isApproved, isFeatured, status, title, price, boostExpiresAt, pinnedUntil, sponsorHomeExpiresAt } = req.body;
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });
  db.prepare(`
    UPDATE listings
    SET is_approved = ?, is_featured = ?, status = ?, title = ?, price = ?, allow_direct_buy = 0,
        boost_expires_at = ?, pinned_until = ?, sponsor_home_expires_at = ?, updated_at = ?
    WHERE id = ?
  `).run(
    isApproved ?? listing.is_approved,
    isFeatured ?? listing.is_featured,
    status || listing.status,
    title || listing.title,
    price ?? listing.price,
    boostExpiresAt ?? listing.boost_expires_at,
    pinnedUntil ?? listing.pinned_until,
    sponsorHomeExpiresAt ?? listing.sponsor_home_expires_at,
    now(),
    req.params.id
  );
  res.json({ ok: true });
});

router.delete("/listings/:id", (req, res) => {
  db.prepare("DELETE FROM listing_images WHERE listing_id = ?").run(req.params.id);
  db.prepare("DELETE FROM listings WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.get("/users", (req, res) => {
  const q = req.query.q || "";
  const users = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id) AS listings_count,
      (SELECT COUNT(*) FROM conversations c WHERE c.buyer_user_id = u.id OR c.seller_user_id = u.id) AS conversations_count,
      (SELECT COUNT(*) FROM offers o WHERE o.buyer_user_id = u.id OR o.seller_user_id = u.id) AS offers_count,
      (SELECT IFNULL(SUM(amount),0) FROM digital_purchases dp WHERE dp.user_id = u.id) AS purchases_total
    FROM users u
    WHERE u.full_name LIKE ? OR IFNULL(u.email,'') LIKE ? OR IFNULL(u.phone, '') LIKE ?
    ORDER BY u.created_at DESC
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(users);
});

router.get("/users/:id", (req, res) => {
  const user = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id) AS listings_count,
      (SELECT COUNT(*) FROM favorites f JOIN listings l ON l.id = f.listing_id WHERE l.user_id = u.id) AS saved_count,
      (SELECT IFNULL(SUM(amount),0) FROM digital_purchases dp WHERE dp.user_id = u.id) AS purchases_total
    FROM users u WHERE u.id = ?
  `).get(req.params.id);
  if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
  const listings = db.prepare("SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC").all(req.params.id).map(mapListing);
  const conversations = db.prepare("SELECT * FROM conversations WHERE buyer_user_id = ? OR seller_user_id = ? ORDER BY last_message_at DESC LIMIT 20").all(req.params.id, req.params.id);
  const messages = conversations.flatMap((c) => db.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 3").all(c.id));
  const offers = db.prepare("SELECT * FROM offers WHERE buyer_user_id = ? OR seller_user_id = ? ORDER BY updated_at DESC").all(req.params.id, req.params.id);
  const transactions = db.prepare(`
    SELECT dp.*, l.title as listing_title, u.full_name as user_name
    FROM digital_purchases dp
    LEFT JOIN listings l ON l.id = dp.listing_id
    LEFT JOIN users u ON u.id = dp.user_id
    WHERE dp.user_id = ? ORDER BY dp.created_at DESC
  `).all(req.params.id).map(purchaseAsTransaction);
  res.json({ user, listings, conversations, messages, offers, transactions });
});

router.put("/users/:id", (req, res) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = Number.parseInt(String(rawId ?? "").trim(), 10);

  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({
      message: "معرف المستخدم غير صالح",
      receivedId: req.params.id,
    });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

  const body = req.body || {};

  const toDbFlag = (value, fallback = 0) => {
    if (value === undefined || value === null || value === "") {
      return Number(fallback ?? 0) ? 1 : 0;
    }
    if (value === true || value === "true" || value === 1 || value === "1") return 1;
    if (value === false || value === "false" || value === 0 || value === "0") return 0;
    return Number(fallback ?? 0) ? 1 : 0;
  };

  const toDbText = (value, fallback = "") => {
    if (typeof value === "string") return value;
    if (value === undefined || value === null) return fallback ?? "";
    return String(value);
  };

  const nextBlocked = Number(toDbFlag(body.isBlocked, user.is_blocked));
  const nextVerified = Number(toDbFlag(body.isVerified, user.is_verified));
  const nextPlan = String(toDbText(body.subscriptionPlan, user.subscription_plan || "free"));
  const nextStatus = String(toDbText(body.subscriptionStatus, user.subscription_status || "inactive"));
  const trustedBadge = nextPlan === "souqi_store_plus" || nextPlan === "souqi_store_pro" ? 1 : 0;
  const subscriptionExpiresAt = nextStatus === "active"
    ? (user.subscription_expires_at && new Date(user.subscription_expires_at).getTime() > Date.now() ? user.subscription_expires_at : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    : null;

  db.prepare(`
    UPDATE users
    SET is_blocked = ?, is_verified = ?, full_name = ?, phone = ?, subscription_plan = ?, subscription_status = ?, subscription_expires_at = ?, trusted_badge = ?
    WHERE id = ?
  `).run(
    nextBlocked,
    nextVerified,
    String(toDbText(body.fullName, user.full_name)),
    String(toDbText(body.phone, user.phone || "")),
    nextPlan,
    nextStatus,
    subscriptionExpiresAt,
    trustedBadge,
    Number(userId)
  );

  const notifications = [];
  if (Number(user.is_blocked || 0) !== nextBlocked) {
    notifications.push(nextBlocked ? "تم حظر الحساب من قبل الإدارة" : "تم فك حظر الحساب من قبل الإدارة");
  }
  if (Number(user.is_verified || 0) !== nextVerified) {
    notifications.push(nextVerified ? "تم توثيق الحساب من قبل الإدارة" : "تم إزالة توثيق الحساب من قبل الإدارة");
  }
  if ((user.subscription_plan || "free") !== nextPlan || (user.subscription_status || "inactive") !== nextStatus) {
    notifications.push(`تم تحديث خطة الحساب إلى ${nextPlan} — الحالة ${nextStatus}`);
  }

  const stmt = db.prepare("INSERT INTO notifications (user_id, title, message, created_at) VALUES (?, ?, ?, ?)");
  notifications.forEach((message) => stmt.run(userId, "تحديث من الإدارة", message, now()));

  res.json({ ok: true });
});

router.get("/reports", (req, res) => {
  const rows = db.prepare(`SELECT r.*, u.full_name as reporter_name FROM reports r LEFT JOIN users u ON u.id = r.reporter_user_id ORDER BY r.created_at DESC`).all();
  res.json(rows);
});

router.put("/reports/:id", (req, res) => {
  const { status, adminNote } = req.body;
  db.prepare("UPDATE reports SET status = ?, admin_note = ? WHERE id = ?").run(status, adminNote || "", req.params.id);
  res.json({ ok: true });
});

router.get("/messages", (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, l.title as listing_title, bu.full_name as buyer_name, su.full_name as seller_name,
      (SELECT message FROM messages m WHERE m.conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message
    FROM conversations c
    JOIN listings l ON l.id = c.listing_id
    JOIN users bu ON bu.id = c.buyer_user_id
    JOIN users su ON su.id = c.seller_user_id
    ORDER BY c.last_message_at DESC
  `).all();
  res.json(rows);
});

router.get("/messages/:id", (req, res) => {
  const convo = db.prepare(`
    SELECT c.*, l.title as listing_title, bu.full_name as buyer_name, su.full_name as seller_name
    FROM conversations c
    JOIN listings l ON l.id = c.listing_id
    JOIN users bu ON bu.id = c.buyer_user_id
    JOIN users su ON su.id = c.seller_user_id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!convo) return res.status(404).json({ message: "المحادثة غير موجودة" });
  const messages = db.prepare(`SELECT m.*, u.full_name as sender_name FROM messages m JOIN users u ON u.id = m.sender_user_id WHERE m.conversation_id = ? ORDER BY m.created_at ASC`).all(req.params.id);
  const offers = db.prepare("SELECT * FROM offers WHERE conversation_id = ? ORDER BY updated_at DESC").all(req.params.id);
  res.json({ conversation: convo, messages, offers });
});

router.get("/offers", (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, l.title as listing_title, b.full_name as buyer_name, s.full_name as seller_name
    FROM offers o
    JOIN listings l ON l.id = o.listing_id
    JOIN users b ON b.id = o.buyer_user_id
    JOIN users s ON s.id = o.seller_user_id
    ORDER BY o.updated_at DESC
  `).all();
  res.json(rows);
});

router.get("/transactions", (req, res) => {
  const rows = db.prepare(`
    SELECT dp.*, l.title as listing_title, u.full_name as user_name
    FROM digital_purchases dp
    LEFT JOIN listings l ON l.id = dp.listing_id
    LEFT JOIN users u ON u.id = dp.user_id
    ORDER BY dp.created_at DESC
  `).all().map(purchaseAsTransaction);
  res.json({ transactions: rows, orders: [] });
});

router.put("/transactions/:id", (req, res) => {
  const tx = db.prepare("SELECT * FROM digital_purchases WHERE id = ?").get(req.params.id);
  if (!tx) return res.status(404).json({ message: "المعاملة غير موجودة" });
  db.prepare("UPDATE digital_purchases SET status = ? WHERE id = ?").run(req.body.status || tx.status, req.params.id);
  res.json({ ok: true });
});

router.get("/categories", (req, res) => res.json(db.prepare("SELECT * FROM categories ORDER BY sort_order ASC, id ASC").all()));
router.post("/categories", (req, res) => {
  const { nameAr, slug, sortOrder, isActive, icon } = req.body;
  db.prepare("INSERT INTO categories (name_ar, slug, sort_order, is_active, icon) VALUES (?, ?, ?, ?, ?)").run(nameAr, slug, sortOrder || 0, isActive ? 1 : 0, icon || "⬢");
  res.json({ ok: true });
});
router.put("/categories/:id", (req, res) => {
  const { nameAr, slug, sortOrder, isActive, icon } = req.body;
  db.prepare("UPDATE categories SET name_ar = ?, slug = ?, sort_order = ?, is_active = ?, icon = ? WHERE id = ?").run(nameAr, slug, sortOrder || 0, isActive ? 1 : 0, icon || "⬢", req.params.id);
  res.json({ ok: true });
});
router.delete("/categories/:id", (req, res) => { db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id); res.json({ ok: true }); });

router.get("/cities", (req, res) => res.json(db.prepare("SELECT * FROM cities ORDER BY sort_order ASC, id ASC").all()));
router.post("/cities", (req, res) => {
  const { nameAr, regionAr, sortOrder, isActive } = req.body;
  db.prepare("INSERT INTO cities (name_ar, region_ar, sort_order, is_active) VALUES (?, ?, ?, ?)").run(nameAr, regionAr || "", sortOrder || 0, isActive ? 1 : 0);
  res.json({ ok: true });
});
router.put("/cities/:id", (req, res) => {
  const { nameAr, regionAr, sortOrder, isActive } = req.body;
  db.prepare("UPDATE cities SET name_ar = ?, region_ar = ?, sort_order = ?, is_active = ? WHERE id = ?").run(nameAr, regionAr || "", sortOrder || 0, isActive ? 1 : 0, req.params.id);
  res.json({ ok: true });
});
router.delete("/cities/:id", (req, res) => { db.prepare("DELETE FROM cities WHERE id = ?").run(req.params.id); res.json({ ok: true }); });

router.get("/settings", (req, res) => {
  res.json(getSettingsObject());
});

router.post("/settings", upload.single("logo"), (req, res) => {
  const incoming = req.body || {};
  const data = { ...incoming };
  if (req.file) data.logo = `/uploads/${req.file.filename}`;
  Object.entries(data).forEach(([key, value]) => upsertSetting(key, value));
  res.json({ ok: true });
});

module.exports = router;
