const bcrypt = require("bcryptjs");
const { initSchema, resetAllData, db } = require("./lib/db");
const { now } = require("./lib/utils");
const { upsertSetting } = require("./lib/marketplace");

initSchema();
resetAllData();

function seedAdmins() {
  db.prepare("INSERT INTO admins (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run("Souqi Admin", "admin@example.com", bcrypt.hashSync("12345678", 10), now());
}

function seedCategories() {
  const rows = [
    ["سيارات", "cars", 1, 1, "🚗"],
    ["عقارات", "real-estate", 2, 1, "🏠"],
    ["إلكترونيات", "electronics", 3, 1, "📱"],
    ["أثاث", "furniture", 4, 1, "🛋️"],
    ["وظائف وخدمات", "services", 5, 1, "🧰"],
    ["متفرقات", "misc", 6, 1, "✨"],
  ];
  const stmt = db.prepare("INSERT INTO categories (name_ar, slug, sort_order, is_active, icon) VALUES (?, ?, ?, ?, ?)");
  rows.forEach((row) => stmt.run(...row));
}

function seedCities() {
  const rows = [
    ["أم الفحم", "منطقة المثلث الشمالي", 1, 1],
    ["باقة الغربية", "منطقة المثلث", 2, 1],
    ["الطيرة", "المثلث الجنوبي", 3, 1],
    ["كفر قاسم", "المثلث الجنوبي", 4, 1],
    ["قلنسوة", "منطقة المثلث", 5, 1],
    ["عرعرة", "وادي عارة", 6, 1],
    ["كفر قرع", "وادي عارة", 7, 1],
    ["الناصرة", "الشمال", 8, 1],
  ];
  const stmt = db.prepare("INSERT INTO cities (name_ar, region_ar, sort_order, is_active) VALUES (?, ?, ?, ?)");
  rows.forEach((row) => stmt.run(...row));
}

function seedSettings() {
  const defaults = {
    platformName: "سوقي",
    primaryTagline: "منصة إعلانات عربية أنيقة للتواصل المباشر بين المستخدمين بدون دفع للسلعة داخل التطبيق.",
    supportPhone: "",
    supportEmail: "",
    contactPhone: "",
    contactEmail: "",
    privacyText: "سياسة الخصوصية قابلة للتعديل من لوحة الأدمن قبل الإطلاق الرسمي.",
    termsText: "يتم التواصل والاتفاق بين الطرفين مباشرة، بينما تُستخدم المدفوعات الرقمية فقط لرفع الإعلان والترقيات والاشتراكات.",
    defaultCityId: "1",
    maxImages: "8",

    raise1DayPrice: "10",
    raise3DaysPrice: "20",
    boost3DaysPrice: "25",
    featured3DaysPrice: "35",
    storeBasicMonthly: "29",
    storePlusMonthly: "49",
    storeProMonthly: "79",

    iosRaise1DayId: "souqi_raise_1_day",
    iosRaise3DaysId: "souqi_raise_3_days",
    iosBoost3DaysId: "souqi_boost_3_days",
    iosFeatured3DaysId: "souqi_featured_3_days",
    iosStoreBasicMonthlyId: "souqi_store_basic_monthly",
    iosStorePlusMonthlyId: "souqi_store_plus_monthly",
    iosStoreProMonthlyId: "souqi_store_pro_monthly",

    androidRaise1DayId: "souqi_raise_1_day",
    androidRaise3DaysId: "souqi_raise_3_days",
    androidBoost3DaysId: "souqi_boost_3_days",
    androidFeatured3DaysId: "souqi_featured_3_days",
    androidStoreBasicMonthlyId: "souqi_store_basic_monthly",
    androidStorePlusMonthlyId: "souqi_store_plus_monthly",
    androidStoreProMonthlyId: "souqi_store_pro_monthly",

    commissionPercent: "0",
    commissionCategoryIds: JSON.stringify([1, 2, 3, 4, 5, 6]),
    otpMode: "local-dev",
  };

  Object.entries(defaults).forEach(([key, value]) => upsertSetting(key, value));
}

seedAdmins();
seedCategories();
seedCities();
seedSettings();

console.log("Seed complete: launch-ready database created without sample users, listings, or conversations.");
