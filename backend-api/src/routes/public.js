const express = require("express");
const { db } = require("../lib/db");
const { getSettingsObject, listingOrderSql, mapListing, iapCatalog, promotionSettings } = require("../lib/marketplace");

const router = express.Router();

function filterByAttributes(rows, query) {
  const checks = {
    brand: (r, v) => String(r.attributes.brand || "").toLowerCase().includes(String(v).toLowerCase()),
    model: (r, v) => String(r.attributes.model || "").toLowerCase().includes(String(v).toLowerCase()),
    year: (r, v) => String(r.attributes.year || "") === String(v),
    transmission: (r, v) => String(r.attributes.transmission || "") === String(v),
    fuel: (r, v) => String(r.attributes.fuel || "") === String(v),
    propertyType: (r, v) => String(r.attributes.propertyType || "") === String(v),
    purpose: (r, v) => String(r.attributes.purpose || "") === String(v),
    rooms: (r, v) => Number(r.attributes.rooms || 0) >= Number(v),
    minKilometers: (r, v) => Number(r.attributes.kilometers || 0) >= Number(v),
    maxKilometers: (r, v) => Number(r.attributes.kilometers || 0) <= Number(v),
    minArea: (r, v) => Number(r.attributes.area || 0) >= Number(v),
    maxArea: (r, v) => Number(r.attributes.area || 0) <= Number(v),
  };
  return rows.filter((row) => Object.entries(checks).every(([key, fn]) => !query[key] || fn(row, query[key])));
}

function activeListingWhereSql(extraClauses = []) {
  return [
    "l.is_approved = 1",
    "l.is_archived = 0",
    "IFNULL(u.is_blocked, 0) = 0",
    ...extraClauses,
  ].join(" AND ");
}

function getActiveListings({ whereClauses = [], params = [], limit = null }) {
  const sql = `
    SELECT l.*
    FROM listings l
    JOIN users u ON u.id = l.user_id
    WHERE ${activeListingWhereSql(whereClauses)}
    ORDER BY ${listingOrderSql("l")}
    ${limit ? `LIMIT ${Number(limit)}` : ""}
  `;
  return db.prepare(sql).all(...params).map(mapListing);
}

router.get("/health", (req, res) => {
  res.json({ ok: true, app: "Souqi Marketplace API", version: "v33-launch-ready" });
});

router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "pong" });
});

router.get("/bootstrap", (req, res) => {
  const cityId = req.query.cityId;
  const categories = db.prepare("SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC").all();
  const cities = db.prepare("SELECT * FROM cities WHERE is_active = 1 ORDER BY sort_order ASC, id ASC").all();
  const featured = getActiveListings({ whereClauses: ["l.is_featured = 1"], limit: 8 });
  const latest = getActiveListings({ limit: 12 });
  const nearby = cityId ? getActiveListings({ whereClauses: ["l.city_id = ?"], params: [cityId], limit: 8 }) : latest.slice(0, 8);
  const sponsoredHome = getActiveListings({ whereClauses: ["l.sponsor_home_expires_at IS NOT NULL", "datetime(l.sponsor_home_expires_at) > datetime('now')"], limit: 6 });
  const pinnedTop = getActiveListings({ whereClauses: ["l.boost_expires_at IS NOT NULL", "datetime(l.boost_expires_at) > datetime('now')"], limit: 6 });
  const settings = getSettingsObject();

  res.json({
    categories,
    cities,
    featured,
    latest,
    nearby,
    sponsoredHome,
    pinnedTop,
    settings,
    catalog: iapCatalog(),
    pricing: promotionSettings(),
  });
});

router.get("/listings", (req, res) => {
  const {
    q = "",
    cityId,
    categoryId,
    minPrice,
    maxPrice,
    condition,
    status,
    featured,
    sort = "latest",
  } = req.query;

  const clauses = ["l.is_approved = 1", "l.is_archived = 0", "IFNULL(u.is_blocked, 0) = 0"];
  const params = [];

  if (q) {
    clauses.push("(l.title LIKE ? OR l.description LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (cityId) {
    clauses.push("l.city_id = ?");
    params.push(cityId);
  }
  if (categoryId) {
    clauses.push("l.category_id = ?");
    params.push(categoryId);
  }
  if (minPrice) {
    clauses.push("l.price >= ?");
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    clauses.push("l.price <= ?");
    params.push(Number(maxPrice));
  }
  if (condition) {
    clauses.push("l.condition = ?");
    params.push(condition);
  }
  if (status) {
    clauses.push("l.status = ?");
    params.push(status);
  }
  if (featured === "1") clauses.push("l.is_featured = 1");

  let orderBy = listingOrderSql("l");
  if (["price_asc", "price_low"].includes(String(sort))) orderBy = "l.price ASC, datetime(l.created_at) DESC";
  if (["price_desc", "price_high"].includes(String(sort))) orderBy = "l.price DESC, datetime(l.created_at) DESC";

  let rows = db.prepare(`
    SELECT l.*
    FROM listings l
    JOIN users u ON u.id = l.user_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY ${orderBy}
  `).all(...params).map(mapListing);
  rows = filterByAttributes(rows, req.query);
  res.json(rows);
});

router.get("/listings/:id", (req, res) => {
  const row = db.prepare(`
    SELECT l.*
    FROM listings l
    JOIN users u ON u.id = l.user_id
    WHERE l.id = ? AND l.is_archived = 0 AND IFNULL(u.is_blocked, 0) = 0
  `).get(req.params.id);

  if (!row) return res.status(404).json({ message: "الإعلان غير موجود" });

  const listing = mapListing(row);
  const similar = db.prepare(`
    SELECT l.*
    FROM listings l
    JOIN users u ON u.id = l.user_id
    WHERE l.category_id = ? AND l.id != ? AND l.is_approved = 1 AND l.is_archived = 0 AND IFNULL(u.is_blocked, 0) = 0
    ORDER BY ${listingOrderSql("l")} LIMIT 6
  `).all(row.category_id, row.id).map(mapListing);

  const activeOffers = db.prepare("SELECT COUNT(*) as count FROM offers WHERE listing_id = ? AND status IN ('pending','countered')").get(row.id).count;
  const pricing = promotionSettings();

  res.json({
    listing,
    similar,
    meta: {
      activeOffers,
      canPromote: true,
      raise1DayPrice: pricing.raise1DayPrice,
      raise3DaysPrice: pricing.raise3DaysPrice,
      boost3DaysPrice: pricing.boost3DaysPrice,
      featured3DaysPrice: pricing.featured3DaysPrice,
    },
  });
});

router.get("/sellers/:id", (req, res) => {
  const seller = db.prepare(`
    SELECT id, full_name, email, phone, avatar, city_id, account_type, subscription_plan,
           subscription_status, subscription_expires_at, trusted_badge, is_verified, is_blocked, created_at
    FROM users WHERE id = ?
  `).get(req.params.id);
  if (!seller || Number(seller.is_blocked || 0) === 1) return res.status(404).json({ message: "البائع غير موجود" });

  const listings = db.prepare(`
    SELECT l.*
    FROM listings l
    JOIN users u ON u.id = l.user_id
    WHERE l.user_id = ? AND l.is_approved = 1 AND l.is_archived = 0 AND IFNULL(u.is_blocked, 0) = 0
    ORDER BY ${listingOrderSql("l")}
  `).all(req.params.id).map(mapListing);

  const city = seller.city_id ? db.prepare("SELECT * FROM cities WHERE id = ?").get(seller.city_id) : null;
  const soldCount = db.prepare("SELECT COUNT(*) as count FROM listings WHERE user_id = ? AND status = 'sold'").get(req.params.id).count;
  res.json({
    seller: {
      ...seller,
      city,
      listings_count: listings.length,
      sold_count: soldCount,
      response_rate: 94,
      rating_placeholder: 4.8,
    },
    listings,
  });
});

router.get("/promotion-pricing", (req, res) => {
  const pricing = promotionSettings();
  const settings = getSettingsObject();
  res.json({
    ...pricing,
    iap: {
      iosRaise1DayId: settings.iosRaise1DayId,
      iosRaise3DaysId: settings.iosRaise3DaysId,
      iosBoost3DaysId: settings.iosBoost3DaysId,
      iosFeatured3DaysId: settings.iosFeatured3DaysId,
      iosStoreBasicMonthlyId: settings.iosStoreBasicMonthlyId,
      iosStorePlusMonthlyId: settings.iosStorePlusMonthlyId,
      iosStoreProMonthlyId: settings.iosStoreProMonthlyId,
      androidRaise1DayId: settings.androidRaise1DayId,
      androidRaise3DaysId: settings.androidRaise3DaysId,
      androidBoost3DaysId: settings.androidBoost3DaysId,
      androidFeatured3DaysId: settings.androidFeatured3DaysId,
      androidStoreBasicMonthlyId: settings.androidStoreBasicMonthlyId,
      androidStorePlusMonthlyId: settings.androidStorePlusMonthlyId,
      androidStoreProMonthlyId: settings.androidStoreProMonthlyId,
    },
    catalog: iapCatalog(),
  });
});

router.get("/settings/public-copy", (req, res) => {
  const settings = getSettingsObject();
  res.json({
    platformName: settings.platformName || "سوقي",
    primaryTagline: settings.primaryTagline || "منصة إعلانات عربية للتواصل المباشر",
    contactPhone: settings.contactPhone || "",
    contactEmail: settings.contactEmail || "",
    termsText: settings.termsText || "",
    privacyText: settings.privacyText || "",
  });
});

module.exports = router;
