const { db } = require("./db");
const { now, addDays, isFuture, tryParseJSON, asNumber } = require("./utils");

function getSetting(key, fallback = "") {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : fallback;
}

function upsertSetting(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, String(value));
}

function getSettingsObject() {
  const rows = db.prepare("SELECT * FROM settings").all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

function listingOrderSql(alias = "") {
  const p = alias ? `${alias}.` : "";
  return `
    CASE WHEN ${p}pinned_until IS NOT NULL AND datetime(${p}pinned_until) > datetime('now') THEN 1 ELSE 0 END DESC,
    CASE WHEN ${p}sponsor_home_expires_at IS NOT NULL AND datetime(${p}sponsor_home_expires_at) > datetime('now') THEN 1 ELSE 0 END DESC,
    CASE WHEN ${p}boost_expires_at IS NOT NULL AND datetime(${p}boost_expires_at) > datetime('now') THEN 1 ELSE 0 END DESC,
    ${p}is_featured DESC,
    datetime(${p}created_at) DESC
  `;
}

function mapSeller(userId) {
  if (!userId) return null;
  return db.prepare(`
    SELECT id, full_name, email, phone, avatar, city_id, account_type, subscription_plan,
           subscription_status, subscription_expires_at, trusted_badge, is_verified, is_blocked, created_at
    FROM users WHERE id = ?
  `).get(userId);
}

function mapListing(row) {
  if (!row) return null;
  const seller = mapSeller(row.user_id);
  const city = db.prepare("SELECT * FROM cities WHERE id = ?").get(row.city_id);
  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(row.category_id);
  const images = db.prepare("SELECT image_path FROM listing_images WHERE listing_id = ? ORDER BY id ASC").all(row.id).map((i) => i.image_path);
  return {
    ...row,
    attributes: tryParseJSON(row.attributes_json, {}),
    images,
    seller,
    city,
    category,
    favorite_count: db.prepare("SELECT COUNT(*) as count FROM favorites WHERE listing_id = ?").get(row.id).count,
    boost_active: isFuture(row.boost_expires_at),
    sponsor_home_active: isFuture(row.sponsor_home_expires_at),
    pinned_active: isFuture(row.pinned_until),
  };
}

function promotionSettings() {
  return {
    raise1DayPrice: asNumber(getSetting("raise1DayPrice", "10"), 10),
    raise3DaysPrice: asNumber(getSetting("raise3DaysPrice", "20"), 20),
    boost3DaysPrice: asNumber(getSetting("boost3DaysPrice", "25"), 25),
    featured3DaysPrice: asNumber(getSetting("featured3DaysPrice", "35"), 35),
    storeBasicMonthly: asNumber(getSetting("storeBasicMonthly", "29"), 29),
    storePlusMonthly: asNumber(getSetting("storePlusMonthly", "49"), 49),
    storeProMonthly: asNumber(getSetting("storeProMonthly", "79"), 79),
  };
}

function iapCatalog() {
  const pricing = promotionSettings();
  return {
    listingPromotions: [
      {
        key: "raise_1_day",
        type: "listing_raise",
        title: "رفع الإعلان — يوم واحد",
        subtitle: "يرفع الإعلان داخل الترتيب العام لمدة يوم واحد.",
        price: pricing.raise1DayPrice,
        durationDays: 1,
        iosProductId: getSetting("iosRaise1DayId", "souqi_raise_1_day"),
        androidProductId: getSetting("androidRaise1DayId", "souqi_raise_1_day"),
      },
      {
        key: "raise_3_days",
        type: "listing_raise",
        title: "رفع الإعلان — 3 أيام",
        subtitle: "يرفع الإعلان داخل الترتيب العام لمدة 3 أيام.",
        price: pricing.raise3DaysPrice,
        durationDays: 3,
        iosProductId: getSetting("iosRaise3DaysId", "souqi_raise_3_days"),
        androidProductId: getSetting("androidRaise3DaysId", "souqi_raise_3_days"),
      },
      {
        key: "boost_3_days",
        type: "listing_boost",
        title: "Boost — 3 أيام",
        subtitle: "زيادة الظهور داخل النتائج والصفحات المخصصة.",
        price: pricing.boost3DaysPrice,
        durationDays: 3,
        iosProductId: getSetting("iosBoost3DaysId", "souqi_boost_3_days"),
        androidProductId: getSetting("androidBoost3DaysId", "souqi_boost_3_days"),
      },
      {
        key: "featured_3_days",
        type: "listing_featured",
        title: "Featured — 3 أيام",
        subtitle: "إبراز الإعلان كمميز وظهوره في الرئيسية لفترة محددة.",
        price: pricing.featured3DaysPrice,
        durationDays: 3,
        iosProductId: getSetting("iosFeatured3DaysId", "souqi_featured_3_days"),
        androidProductId: getSetting("androidFeatured3DaysId", "souqi_featured_3_days"),
      },
    ],
    subscriptions: [
      {
        key: "store_basic_monthly",
        planKey: "souqi_store_basic",
        title: "متجر Basic",
        subtitle: "حدود نشر أفضل وظهور أقوى لنفس الحساب العادي.",
        price: pricing.storeBasicMonthly,
        durationDays: 30,
        iosProductId: getSetting("iosStoreBasicMonthlyId", "souqi_store_basic_monthly"),
        androidProductId: getSetting("androidStoreBasicMonthlyId", "souqi_store_basic_monthly"),
      },
      {
        key: "store_plus_monthly",
        planKey: "souqi_store_plus",
        title: "متجر Plus",
        subtitle: "مزايا أعلى، شارة موثوق، وأولوية ظهور أفضل.",
        price: pricing.storePlusMonthly,
        durationDays: 30,
        iosProductId: getSetting("iosStorePlusMonthlyId", "souqi_store_plus_monthly"),
        androidProductId: getSetting("androidStorePlusMonthlyId", "souqi_store_plus_monthly"),
      },
      {
        key: "store_pro_monthly",
        planKey: "souqi_store_pro",
        title: "متجر Pro",
        subtitle: "أعلى باقة شهرية للحسابات النشطة داخل سوقي.",
        price: pricing.storeProMonthly,
        durationDays: 30,
        iosProductId: getSetting("iosStoreProMonthlyId", "souqi_store_pro_monthly"),
        androidProductId: getSetting("androidStoreProMonthlyId", "souqi_store_pro_monthly"),
      },
    ],
  };
}

function catalogByKey(key) {
  const catalog = iapCatalog();
  return [...catalog.listingPromotions, ...catalog.subscriptions].find((item) => item.key === key) || null;
}

function extendFrom(baseDate, days) {
  const start = isFuture(baseDate) ? baseDate : now();
  return { startDate: start, endDate: addDays(start, days) };
}

function applyListingPromotion({ listingId, userId, productKey, price, days, sourcePurchaseId = null }) {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ? AND user_id = ?").get(listingId, userId);
  if (!listing) throw new Error("الإعلان غير موجود أو لا تملك صلاحيته");

  let kind = "boost";
  let column = "boost_expires_at";
  if (productKey === "raise_1_day" || productKey === "raise_3_days") {
    kind = "raise";
    column = "boost_expires_at";
  } else if (productKey === "boost_3_days") {
    kind = "boost";
    column = "boost_expires_at";
  } else if (productKey === "featured_3_days") {
    kind = "featured";
    column = "sponsor_home_expires_at";
  }

  const currentValue = column === "sponsor_home_expires_at" ? listing.sponsor_home_expires_at : listing.boost_expires_at;
  const { startDate, endDate } = extendFrom(currentValue, days);

  if (productKey === "featured_3_days") {
    db.prepare("UPDATE listings SET sponsor_home_expires_at = ?, is_featured = 1, updated_at = ? WHERE id = ?").run(endDate, now(), listingId);
  } else {
    db.prepare("UPDATE listings SET boost_expires_at = ?, updated_at = ? WHERE id = ?").run(endDate, now(), listingId);
  }

  db.prepare(`
    INSERT INTO boost_subscriptions (listing_id, user_id, kind, days, price, source_purchase_id, start_date, end_date, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(listingId, userId, kind, days, price, sourcePurchaseId, startDate, endDate, now());

  db.prepare("INSERT INTO notifications (user_id, title, message, created_at) VALUES (?, ?, ?, ?)").run(
    userId,
    "تم تفعيل ترقية الإعلان",
    `${productKey === "featured_3_days" ? "تم تفعيل إعلان Featured" : "تم تفعيل رفع/Boost الإعلان"} حتى ${endDate}`,
    now()
  );

  return { startDate, endDate, kind };
}

function applyStoreSubscription({ userId, planKey, price, days, sourcePurchaseId = null }) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) throw new Error("المستخدم غير موجود");
  const { startDate, endDate } = extendFrom(user.subscription_expires_at, days);

  const trustedBadge = planKey === "souqi_store_plus" || planKey === "souqi_store_pro" ? 1 : user.trusted_badge;
  db.prepare(`
    UPDATE users
    SET subscription_plan = ?, subscription_status = 'active', subscription_expires_at = ?, trusted_badge = ?, account_type = 'user'
    WHERE id = ?
  `).run(planKey, endDate, trustedBadge, userId);

  db.prepare("INSERT INTO notifications (user_id, title, message, created_at) VALUES (?, ?, ?, ?)").run(
    userId,
    "تم تفعيل الاشتراك",
    `تم تفعيل اشتراك ${planKey} حتى ${endDate}`,
    now()
  );

  return { startDate, endDate, planKey, sourcePurchaseId, price };
}

function createDigitalPurchase({
  userId,
  listingId = null,
  productType,
  productKey,
  planKey = null,
  store,
  productId,
  purchaseToken,
  orderRef,
  durationDays,
  amount,
  currency = "ILS",
  startsAt = null,
  endsAt = null,
  metadata = {},
}) {
  const token = purchaseToken || `${store}:${productKey}:${userId}:${Date.now()}`;
  const existing = db.prepare("SELECT * FROM digital_purchases WHERE purchase_token = ?").get(token);
  if (existing) return existing;

  const info = db.prepare(`
    INSERT INTO digital_purchases (
      user_id, listing_id, product_type, product_key, plan_key, store, product_id, purchase_token,
      order_ref, duration_days, amount, currency, status, starts_at, ends_at, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'applied', ?, ?, ?, ?)
  `).run(
    userId,
    listingId,
    productType,
    productKey,
    planKey,
    store,
    productId,
    token,
    orderRef || null,
    durationDays || 0,
    amount,
    currency,
    startsAt,
    endsAt,
    JSON.stringify(metadata || {}),
    now()
  );
  return db.prepare("SELECT * FROM digital_purchases WHERE id = ?").get(info.lastInsertRowid);
}

function activateCatalogProduct({ userId, productKey, listingId = null, store = "local-dev", purchaseToken = "", orderRef = "", metadata = {} }) {
  const product = catalogByKey(productKey);
  if (!product) throw new Error("منتج الترقية غير معروف");

  if (product.type && product.type.startsWith("listing_") && !listingId) {
    throw new Error("يجب تحديد الإعلان المطلوب تفعيل الترقية عليه");
  }

  let activation;
  if (product.type && product.type.startsWith("listing_")) {
    activation = applyListingPromotion({
      listingId,
      userId,
      productKey,
      price: product.price,
      days: product.durationDays,
    });
  } else {
    activation = applyStoreSubscription({
      userId,
      planKey: product.planKey,
      price: product.price,
      days: product.durationDays,
    });
  }

  const purchase = createDigitalPurchase({
    userId,
    listingId,
    productType: product.type || "subscription",
    productKey: product.key,
    planKey: product.planKey || null,
    store,
    productId: store === "ios" ? product.iosProductId : store === "android" ? product.androidProductId : product.key,
    purchaseToken,
    orderRef,
    durationDays: product.durationDays,
    amount: product.price,
    startsAt: activation.startDate,
    endsAt: activation.endDate,
    metadata,
  });

  if (product.type && product.type.startsWith("listing_")) {
    const latestBoost = db.prepare(`
      SELECT id FROM boost_subscriptions
      WHERE source_purchase_id IS NULL AND listing_id = ? AND user_id = ?
      ORDER BY id DESC LIMIT 1
    `).get(listingId, userId);
    if (latestBoost) {
      db.prepare("UPDATE boost_subscriptions SET source_purchase_id = ? WHERE id = ?").run(purchase.id, latestBoost.id);
    }
  }

  return { product, purchase, activation };
}

module.exports = {
  getSetting,
  upsertSetting,
  getSettingsObject,
  listingOrderSql,
  mapListing,
  mapSeller,
  promotionSettings,
  iapCatalog,
  catalogByKey,
  activateCatalogProduct,
};
