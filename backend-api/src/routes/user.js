const express = require("express");
const { db } = require("../lib/db");
const { sendPushToUser, validExpoToken } = require("../lib/push");
const { requireAuth } = require("../lib/auth");
const {
  now,
  tryParseJSON,
  isValidPhone,
  normalizePhone,
} = require("../lib/utils");
const { upload } = require("../middleware/upload");
const { getSettingsObject, listingOrderSql, mapListing, mapSeller, iapCatalog, activateCatalogProduct } = require("../lib/marketplace");

const router = express.Router();

function mapConversation(row, currentUserId) {
  const otherId = Number(row.buyer_user_id) === Number(currentUserId) ? row.seller_user_id : row.buyer_user_id;
  const otherUser = mapSeller(otherId);
  const listing = mapListing(db.prepare("SELECT * FROM listings WHERE id = ?").get(row.listing_id));
  const lastMessage = db.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1").get(row.id);
  const unread = db.prepare("SELECT COUNT(*) as count FROM messages WHERE conversation_id = ? AND sender_user_id != ? AND is_read = 0").get(row.id, currentUserId).count;
  return { ...row, otherUser, listing, lastMessage, unread };
}

function notifyUser(userId, title, message, pushData = {}) {
  if (!userId || !title || !message) return;
  db.prepare("INSERT INTO notifications (user_id, title, message, created_at) VALUES (?, ?, ?, ?)").run(userId, title, message, now());
  sendPushToUser(userId, { title, body: message, data: pushData }).catch(() => null);
}

function ensureListingVisibleForDeal(listingId) {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
  if (!listing) throw new Error("الإعلان غير موجود");
  return listing;
}

function markListingSoldFromOffer({ listingId, soldPrice, sellerUserId, buyerUserId, offerId, conversationId = null }) {
  const listing = ensureListingVisibleForDeal(listingId);
  db.prepare("UPDATE listings SET status = 'sold', sold_price = ?, allow_direct_buy = 0, updated_at = ? WHERE id = ?").run(Number(soldPrice || listing.price || 0), now(), listingId);
  db.prepare("UPDATE offers SET status = 'closed_after_sale', updated_at = ? WHERE listing_id = ? AND id != ? AND status IN ('pending','countered')").run(now(), listingId, offerId);
  notifyUser(sellerUserId, "تم البيع", `تم تحديث حالة الإعلان "${listing.title}" إلى تم البيع.`, { type: "listing_sold", listingId });
  notifyUser(buyerUserId, "تم تأكيد الصفقة", `تم قبول العرض وتحويل الإعلان "${listing.title}" إلى تم البيع.`, { type: "listing_sold", listingId, conversationId });
  if (conversationId) {
    db.prepare("INSERT INTO messages (conversation_id, sender_user_id, message, created_at) VALUES (?, ?, ?, ?)").run(conversationId, sellerUserId, `تم إنهاء الصفقة وتحويل حالة الإعلان إلى: تم البيع بسعر ${Number(soldPrice || listing.price || 0).toLocaleString()} ₪`, now());
    db.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").run(now(), conversationId);
  }
}

function validateListingPayload(body, { requireImages = false, imagesCount = 0 } = {}) {
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const price = Number(body?.price || 0);
  const categoryId = Number(body?.categoryId || 0);
  const cityId = Number(body?.cityId || 0);
  const condition = String(body?.condition || "used").trim() || "used";
  const whatsapp = normalizePhone(body?.whatsapp || "");
  const phone = normalizePhone(body?.phone || "");
  const attributes = body?.attributes || "{}";

  if (!title || title.length < 4) throw new Error("عنوان الإعلان مطلوب ويجب أن يكون أوضح");
  if (!description || description.length < 10) throw new Error("وصف الإعلان مطلوب ويجب أن يكون واضحًا");
  if (!Number.isFinite(price) || price <= 0) throw new Error("أدخل سعرًا صحيحًا للإعلان");
  if (!categoryId || !cityId) throw new Error("اختر القسم والمدينة قبل حفظ الإعلان");
  if (requireImages && imagesCount < 1) throw new Error("إضافة صورة واحدة على الأقل للإعلان إجبارية");
  if (phone && !isValidPhone(phone)) throw new Error("رقم الهاتف يجب أن يكون أرقامًا فقط وبصيغة صحيحة");
  if (whatsapp && !isValidPhone(whatsapp)) throw new Error("رقم واتساب يجب أن يكون أرقامًا فقط وبصيغة صحيحة");

  return { title, description, price, categoryId, cityId, condition, whatsapp, phone, attributes };
}

router.get("/profile", requireAuth("user"), (req, res) => {
  const user = db.prepare(`
    SELECT id, full_name, email, phone, city_id, avatar, account_type, subscription_plan,
           subscription_status, subscription_expires_at, trusted_badge, bank_account_name,
           bank_name, bank_iban, payout_notes, is_verified, is_blocked
    FROM users WHERE id = ?
  `).get(req.auth.id);

  const myListings = db.prepare(`SELECT * FROM listings WHERE user_id = ? ORDER BY ${listingOrderSql()}`).all(req.auth.id).map(mapListing);
  const favorites = db.prepare(`SELECT l.* FROM favorites f JOIN listings l ON l.id = f.listing_id WHERE f.user_id = ? ORDER BY f.created_at DESC`).all(req.auth.id).map(mapListing);
  const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC").all(req.auth.id);
  const conversations = db.prepare(`SELECT * FROM conversations WHERE buyer_user_id = ? OR seller_user_id = ? ORDER BY last_message_at DESC`).all(req.auth.id, req.auth.id).map((row) => mapConversation(row, req.auth.id));
  const offers = db.prepare(`SELECT o.*, l.title as listing_title FROM offers o JOIN listings l ON l.id = o.listing_id WHERE o.buyer_user_id = ? OR o.seller_user_id = ? ORDER BY o.updated_at DESC`).all(req.auth.id, req.auth.id);
  const boosts = db.prepare("SELECT * FROM boost_subscriptions WHERE user_id = ? ORDER BY created_at DESC").all(req.auth.id);
  const purchases = db.prepare("SELECT * FROM digital_purchases WHERE user_id = ? ORDER BY created_at DESC").all(req.auth.id).map((row) => ({ ...row, metadata: tryParseJSON(row.metadata_json, {}) }));
  const favoriteIds = favorites.map((item) => item.id);
  res.json({ user, myListings, favorites, favoriteIds, notifications, conversations, offers, boosts, purchases });
});

router.put("/profile", requireAuth("user"), (req, res) => {
  const current = db.prepare("SELECT * FROM users WHERE id = ?").get(req.auth.id);
  const fullName = String(req.body?.fullName || current.full_name || "").trim();
  const phone = normalizePhone(req.body?.phone || current.phone || "");
  const cityId = req.body?.cityId || current.city_id;
  const bankAccountName = req.body?.bankAccountName ?? current.bank_account_name;
  const bankName = req.body?.bankName ?? current.bank_name;
  const bankIban = req.body?.bankIban ?? current.bank_iban;
  const payoutNotes = req.body?.payoutNotes ?? current.payout_notes;

  if (!fullName) return res.status(400).json({ message: "الاسم الكامل مطلوب" });
  if (phone && !isValidPhone(phone)) return res.status(400).json({ message: "رقم الجوال يجب أن يكون أرقامًا فقط وبصيغة صحيحة" });

  db.prepare(`
    UPDATE users
    SET full_name = ?, phone = ?, city_id = ?, role = 'user', seller_status = 'active',
        account_type = 'user', bank_account_name = ?, bank_name = ?, bank_iban = ?, payout_notes = ?
    WHERE id = ?
  `).run(fullName, phone || null, cityId || null, bankAccountName, bankName, bankIban, payoutNotes, req.auth.id);

  const user = db.prepare(`
    SELECT id, full_name, email, phone, city_id, avatar, account_type, subscription_plan,
           subscription_status, subscription_expires_at, trusted_badge, bank_account_name,
           bank_name, bank_iban, payout_notes, is_verified, is_blocked
    FROM users WHERE id = ?
  `).get(req.auth.id);
  res.json(user);
});

router.get("/promotions/catalog", requireAuth("user"), (req, res) => {
  res.json({ settings: getSettingsObject(), catalog: iapCatalog() });
});

router.post("/iap/activate", requireAuth("user"), (req, res) => {
  const { productKey, listingId, store = "app-review", purchaseToken = "", orderRef = "", metadata = {} } = req.body || {};
  const result = activateCatalogProduct({
    userId: req.auth.id,
    productKey,
    listingId: listingId ? Number(listingId) : null,
    store,
    purchaseToken,
    orderRef,
    metadata,
  });
  res.json({ ok: true, ...result });
});


router.post("/push/register", requireAuth("user"), (req, res) => {
  const expoPushToken = String(req.body?.token || "").trim();
  const platform = String(req.body?.platform || "").trim();
  const projectId = String(req.body?.projectId || "").trim();
  const appOwnership = String(req.body?.appOwnership || "").trim();
  const deviceName = String(req.body?.deviceName || "").trim();

  if (!validExpoToken(expoPushToken)) {
    return res.status(400).json({ message: "Expo push token غير صالح" });
  }

  db.prepare(`
    INSERT INTO user_push_tokens (user_id, expo_push_token, platform, project_id, app_ownership, device_name, is_active, last_seen_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(expo_push_token) DO UPDATE SET
      user_id = excluded.user_id,
      platform = excluded.platform,
      project_id = excluded.project_id,
      app_ownership = excluded.app_ownership,
      device_name = excluded.device_name,
      is_active = 1,
      last_seen_at = excluded.last_seen_at
  `).run(req.auth.id, expoPushToken, platform || null, projectId || null, appOwnership || null, deviceName || null, now(), now());

  res.json({ ok: true, token: expoPushToken });
});

router.post("/notifications/read-all", requireAuth("user"), (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(req.auth.id);
  res.json({ ok: true });
});

router.post("/favorites/:listingId", requireAuth("user"), (req, res) => {
  const existing = db.prepare("SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?").get(req.auth.id, req.params.listingId);
  if (existing) {
    db.prepare("DELETE FROM favorites WHERE id = ?").run(existing.id);
    return res.json({ favorite: false });
  }
  db.prepare("INSERT INTO favorites (user_id, listing_id, created_at) VALUES (?, ?, ?)").run(req.auth.id, req.params.listingId, now());
  res.json({ favorite: true });
});

router.post("/conversations/start", requireAuth("user"), (req, res) => {
  const { listingId, message } = req.body;
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
  if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });
  if (String(listing.status) === "sold") return res.status(400).json({ message: "هذا الإعلان تم بيعه بالفعل" });
  if (Number(listing.user_id) === Number(req.auth.id)) return res.status(400).json({ message: "لا يمكنك مراسلة نفسك" });
  const existing = db.prepare("SELECT * FROM conversations WHERE listing_id = ? AND buyer_user_id = ? AND seller_user_id = ?").get(listingId, req.auth.id, listing.user_id);
  let conversationId = existing?.id;
  if (!conversationId) {
    const info = db.prepare("INSERT INTO conversations (listing_id, buyer_user_id, seller_user_id, last_message_at, created_at) VALUES (?, ?, ?, ?, ?)").run(listingId, req.auth.id, listing.user_id, now(), now());
    conversationId = info.lastInsertRowid;
  }
  if (message) {
    db.prepare("INSERT INTO messages (conversation_id, sender_user_id, message, created_at) VALUES (?, ?, ?, ?)").run(conversationId, req.auth.id, message, now());
    db.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").run(now(), conversationId);
    notifyUser(listing.user_id, "رسالة جديدة", `وصلتك رسالة جديدة على إعلان: ${listing.title}`, { type: "message", conversationId, listingId: Number(listingId) });
  }
  const row = db.prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId);
  res.json(mapConversation(row, req.auth.id));
});

router.get("/conversations/:id/messages", requireAuth("user"), (req, res) => {
  const conversation = db.prepare("SELECT * FROM conversations WHERE id = ? AND (buyer_user_id = ? OR seller_user_id = ?)").get(req.params.id, req.auth.id, req.auth.id);
  if (!conversation) return res.status(404).json({ message: "المحادثة غير موجودة" });
  const messages = db.prepare(`SELECT m.*, u.full_name as sender_name FROM messages m JOIN users u ON u.id = m.sender_user_id WHERE conversation_id = ? ORDER BY id ASC`).all(req.params.id);
  const offers = db.prepare("SELECT * FROM offers WHERE conversation_id = ? ORDER BY id DESC").all(req.params.id);
  db.prepare("UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_user_id != ?").run(req.params.id, req.auth.id);
  res.json({ conversation: mapConversation(conversation, req.auth.id), messages, offers });
});

router.post("/conversations/:id/messages", requireAuth("user"), (req, res) => {
  const conversation = db.prepare("SELECT * FROM conversations WHERE id = ? AND (buyer_user_id = ? OR seller_user_id = ?)").get(req.params.id, req.auth.id, req.auth.id);
  if (!conversation) return res.status(404).json({ message: "المحادثة غير موجودة" });
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(conversation.listing_id);
  if (listing?.status === "sold") return res.status(400).json({ message: "تم بيع الإعلان، ولا يمكن متابعة التفاوض عليه" });
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: "الرسالة مطلوبة" });
  db.prepare("INSERT INTO messages (conversation_id, sender_user_id, message, created_at) VALUES (?, ?, ?, ?)").run(req.params.id, req.auth.id, message, now());
  db.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").run(now(), req.params.id);
  const receiverId = Number(conversation.buyer_user_id) === Number(req.auth.id) ? conversation.seller_user_id : conversation.buyer_user_id;
  notifyUser(receiverId, "رسالة جديدة", `وصلك رد جديد داخل المحادثة على إعلان: ${listing?.title || "إعلانك"}`, { type: "message", conversationId: Number(req.params.id), listingId: Number(conversation.listing_id) });
  res.json({ ok: true });
});

router.post("/offers", requireAuth("user"), (req, res) => {
  const { listingId, amount, message = "" } = req.body;
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
  if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });
  if (String(listing.status) === "sold") return res.status(400).json({ message: "تم بيع هذا الإعلان بالفعل" });

  let conv = db.prepare("SELECT * FROM conversations WHERE listing_id = ? AND buyer_user_id = ? AND seller_user_id = ?").get(listingId, req.auth.id, listing.user_id);
  if (!conv) {
    const info = db.prepare("INSERT INTO conversations (listing_id, buyer_user_id, seller_user_id, last_message_at, created_at) VALUES (?, ?, ?, ?, ?)").run(listingId, req.auth.id, listing.user_id, now(), now());
    conv = { id: info.lastInsertRowid };
  }

  const parsedAmount = Number(amount || 0);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ message: "قيمة العرض غير صحيحة" });

  const info = db.prepare(`
    INSERT INTO offers (listing_id, conversation_id, buyer_user_id, seller_user_id, amount, status, message, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `).run(listingId, conv.id, req.auth.id, listing.user_id, parsedAmount, message, now(), now());

  db.prepare("INSERT INTO messages (conversation_id, sender_user_id, message, created_at) VALUES (?, ?, ?, ?)").run(conv.id, req.auth.id, `قدّمت عرضًا بقيمة ${parsedAmount.toLocaleString()} ₪${message ? ` — ${message}` : ""}`, now());
  db.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").run(now(), conv.id);
  notifyUser(listing.user_id, "عرض سعر جديد", `هناك عرض جديد على إعلان: ${listing.title}`, { type: "offer", conversationId: conv.id, listingId: Number(listingId) });
  res.json(db.prepare("SELECT * FROM offers WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/offers/:id", requireAuth("user"), (req, res) => {
  const offer = db.prepare("SELECT * FROM offers WHERE id = ?").get(req.params.id);
  if (!offer) return res.status(404).json({ message: "العرض غير موجود" });
  const { action, counterAmount } = req.body;
  if (Number(offer.seller_user_id) !== Number(req.auth.id) && Number(offer.buyer_user_id) !== Number(req.auth.id)) {
    return res.status(403).json({ message: "لا تملك الصلاحية" });
  }

  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(offer.listing_id);
  if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });
  if (String(listing.status) === "sold" && action !== "cancel") {
    return res.status(400).json({ message: "الإعلان تم بيعه بالفعل" });
  }

  let status = offer.status;
  let amount = offer.amount;
  if (action === "accept" && Number(offer.seller_user_id) === Number(req.auth.id)) status = "accepted";
  else if (action === "reject" && Number(offer.seller_user_id) === Number(req.auth.id)) status = "rejected";
  else if (action === "counter" && Number(offer.seller_user_id) === Number(req.auth.id)) {
    status = "countered";
    amount = Number(counterAmount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "قيمة العرض المقابل غير صحيحة" });
  } else if (action === "cancel" && Number(offer.buyer_user_id) === Number(req.auth.id)) status = "cancelled";
  else return res.status(400).json({ message: "الإجراء غير مسموح" });

  db.prepare("UPDATE offers SET status = ?, amount = ?, updated_at = ? WHERE id = ?").run(status, amount, now(), req.params.id);
  const receiverId = Number(req.auth.id) === Number(offer.seller_user_id) ? offer.buyer_user_id : offer.seller_user_id;
  notifyUser(receiverId, "تحديث على العرض", `تم تحديث حالة العرض إلى: ${status}`, { type: "offer_update", conversationId: offer.conversation_id, listingId: Number(offer.listing_id) });
  if (offer.conversation_id) {
    const text = status === "accepted" ? `تم قبول العرض بسعر ${amount} ₪` : status === "rejected" ? "تم رفض العرض" : status === "cancelled" ? "تم إلغاء العرض" : `عرض مقابل جديد: ${amount} ₪`;
    db.prepare("INSERT INTO messages (conversation_id, sender_user_id, message, created_at) VALUES (?, ?, ?, ?)").run(offer.conversation_id, req.auth.id, text, now());
    db.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").run(now(), offer.conversation_id);
  }

  if (status === "accepted") {
    markListingSoldFromOffer({
      listingId: offer.listing_id,
      soldPrice: amount,
      sellerUserId: offer.seller_user_id,
      buyerUserId: offer.buyer_user_id,
      offerId: offer.id,
      conversationId: offer.conversation_id,
    });
  }

  res.json({ ok: true, status, amount, listingStatus: status === "accepted" ? "sold" : listing.status });
});

router.post("/listings", requireAuth("user"), upload.array("images", 8), (req, res) => {
  try {
    const validated = validateListingPayload(req.body, { requireImages: true, imagesCount: req.files?.length || 0 });
    const timestamp = now();
    const coverImage = req.files?.[0] ? `/uploads/${req.files[0].filename}` : null;
    const info = db.prepare(`
      INSERT INTO listings (
        user_id, category_id, city_id, title, description, price, condition, status,
        whatsapp, phone, is_featured, is_approved, is_archived, allow_direct_buy, cover_image, attributes_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, 0, 1, 0, 0, ?, ?, ?, ?)
    `).run(req.auth.id, validated.categoryId, validated.cityId, validated.title, validated.description, validated.price, validated.condition, validated.whatsapp || "", validated.phone || "", coverImage, validated.attributes || "{}", timestamp, timestamp);
    const listingId = info.lastInsertRowid;
    for (const file of req.files || []) db.prepare("INSERT INTO listing_images (listing_id, image_path) VALUES (?, ?)").run(listingId, `/uploads/${file.filename}`);
    notifyUser(req.auth.id, "تم نشر الإعلان", `تم نشر إعلانك بنجاح: ${validated.title}`, { type: "listing_published", listingId });
    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
    res.json(mapListing(listing));
  } catch (error) {
    res.status(400).json({ message: error.message || "تعذر حفظ الإعلان" });
  }
});

router.get("/listings/:id", requireAuth("user"), (req, res) => {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ? AND user_id = ?").get(req.params.id, req.auth.id);
  if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });
  res.json(mapListing(listing));
});

router.put("/listings/:id", requireAuth("user"), (req, res) => {
  try {
    const listing = db.prepare("SELECT * FROM listings WHERE id = ? AND user_id = ?").get(req.params.id, req.auth.id);
    if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });
    const validated = validateListingPayload(req.body, { requireImages: false, imagesCount: db.prepare("SELECT COUNT(*) as count FROM listing_images WHERE listing_id = ?").get(req.params.id).count });
    const status = String(req.body?.status || listing.status || "available");
    db.prepare(`
      UPDATE listings
      SET title = ?, description = ?, price = ?, category_id = ?, city_id = ?, condition = ?, whatsapp = ?, phone = ?, status = ?, attributes_json = ?, allow_direct_buy = 0, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(validated.title, validated.description, validated.price, validated.categoryId, validated.cityId, validated.condition, validated.whatsapp, validated.phone, status, validated.attributes || "{}", now(), req.params.id, req.auth.id);
    notifyUser(req.auth.id, "تم تحديث الإعلان", `تم تحديث بيانات إعلانك: ${validated.title}`, { type: "listing_updated", listingId: Number(req.params.id) });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error.message || "تعذر تحديث الإعلان" });
  }
});

router.delete("/listings/:id", requireAuth("user"), (req, res) => {
  db.prepare("DELETE FROM listing_images WHERE listing_id = ?").run(req.params.id);
  db.prepare("DELETE FROM listings WHERE id = ? AND user_id = ?").run(req.params.id, req.auth.id);
  res.json({ ok: true });
});

router.post("/listings/:id/boost", requireAuth("user"), (req, res) => {
  const days = Math.max(1, Number(req.body.days || 1));
  const productKey = days >= 3 ? "raise_3_days" : "raise_1_day";
  const result = activateCatalogProduct({ userId: req.auth.id, listingId: Number(req.params.id), productKey, store: "app-review" });
  res.json({ ok: true, days: result.product.durationDays, price: result.product.price, endDate: result.activation.endDate, mappedProduct: productKey });
});

router.post("/listings/:id/pin-top", requireAuth("user"), (req, res) => {
  const result = activateCatalogProduct({ userId: req.auth.id, listingId: Number(req.params.id), productKey: "raise_3_days", store: "app-review" });
  res.json({ ok: true, days: result.product.durationDays, price: result.product.price, endDate: result.activation.endDate, mappedProduct: "raise_3_days" });
});

router.post("/listings/:id/sponsor-home", requireAuth("user"), (req, res) => {
  const result = activateCatalogProduct({ userId: req.auth.id, listingId: Number(req.params.id), productKey: "featured_3_days", store: "app-review" });
  res.json({ ok: true, days: result.product.durationDays, price: result.product.price, endDate: result.activation.endDate, mappedProduct: "featured_3_days" });
});

router.post("/listings/:id/direct-buy", requireAuth("user"), (req, res) => {
  return res.status(400).json({ message: "الشراء المباشر داخل التطبيق غير مفعل في سوقي. التواصل وإتمام الصفقة يكونان مباشرة بين المستخدمين." });
});

router.post("/listings/:id/mark-sold", requireAuth("user"), (req, res) => {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ? AND user_id = ?").get(req.params.id, req.auth.id);
  if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });
  const soldPrice = Number(req.body.soldPrice || listing.price || 0);
  db.prepare("UPDATE listings SET status = 'sold', sold_price = ?, allow_direct_buy = 0, updated_at = ? WHERE id = ?").run(soldPrice, now(), listing.id);
  db.prepare("UPDATE offers SET status = 'closed_after_sale', updated_at = ? WHERE listing_id = ? AND status IN ('pending','countered')").run(now(), listing.id);
  notifyUser(req.auth.id, "تم تسجيل البيع", `تم تسجيل الإعلان كمباع بسعر ${soldPrice} ₪`, { type: "listing_sold", listingId: Number(listing.id) });
  res.json({ ok: true, soldPrice });
});

module.exports = router;
