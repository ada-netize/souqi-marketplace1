const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const { DATA_DIR, DB_PATH } = require("../config");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = OFF;
`);

function tableInfo(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all();
}

function columnExists(table, name) {
  try {
    return tableInfo(table).some((c) => c.name === name);
  } catch {
    return false;
  }
}

function ensureColumn(table, name, definition) {
  if (!columnExists(table, name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      phone TEXT UNIQUE,
      city_id INTEGER,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      seller_status TEXT DEFAULT 'active',
      bank_account_name TEXT,
      bank_name TEXT,
      bank_iban TEXT,
      payout_notes TEXT,
      account_type TEXT DEFAULT 'user',
      subscription_plan TEXT DEFAULT 'free',
      subscription_status TEXT DEFAULT 'inactive',
      subscription_expires_at TEXT,
      trusted_badge INTEGER DEFAULT 0,
      is_blocked INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_ar TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_ar TEXT NOT NULL,
      region_ar TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      city_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      condition TEXT DEFAULT 'used',
      status TEXT DEFAULT 'available',
      whatsapp TEXT,
      phone TEXT,
      is_featured INTEGER DEFAULT 0,
      is_approved INTEGER DEFAULT 1,
      is_archived INTEGER DEFAULT 0,
      allow_direct_buy INTEGER DEFAULT 0,
      pinned_until TEXT,
      cover_image TEXT,
      attributes_json TEXT,
      sold_price REAL,
      boost_expires_at TEXT,
      sponsor_home_expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      image_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, listing_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_user_id INTEGER,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      admin_note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );



    CREATE TABLE IF NOT EXISTS user_push_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      expo_push_token TEXT UNIQUE NOT NULL,
      platform TEXT,
      project_id TEXT,
      app_ownership TEXT,
      device_name TEXT,
      is_active INTEGER DEFAULT 1,
      last_seen_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT DEFAULT 'login',
      expires_at TEXT NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      buyer_user_id INTEGER NOT NULL,
      seller_user_id INTEGER NOT NULL,
      last_message_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(listing_id, buyer_user_id, seller_user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      conversation_id INTEGER,
      buyer_user_id INTEGER NOT NULL,
      seller_user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS boost_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      days INTEGER NOT NULL,
      price REAL NOT NULL,
      source_purchase_id INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS digital_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER,
      product_type TEXT NOT NULL,
      product_key TEXT NOT NULL,
      plan_key TEXT,
      store TEXT NOT NULL,
      product_id TEXT NOT NULL,
      purchase_token TEXT UNIQUE,
      order_ref TEXT,
      duration_days INTEGER DEFAULT 0,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'ILS',
      status TEXT DEFAULT 'applied',
      starts_at TEXT,
      ends_at TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      seller_user_id INTEGER NOT NULL,
      buyer_user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      seller_amount REAL NOT NULL,
      platform_fee REAL NOT NULL,
      payment_status TEXT DEFAULT 'disabled',
      order_status TEXT DEFAULT 'disabled',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      seller_user_id INTEGER NOT NULL,
      buyer_user_id INTEGER,
      amount REAL NOT NULL,
      commission_percent REAL NOT NULL,
      commission_amount REAL NOT NULL,
      seller_amount REAL NOT NULL,
      store_manager_amount REAL NOT NULL,
      status TEXT DEFAULT 'disabled',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
    CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
    CREATE INDEX IF NOT EXISTS idx_listings_city_id ON listings(city_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON conversations(listing_id);
    CREATE INDEX IF NOT EXISTS idx_digital_purchases_user_id ON digital_purchases(user_id);
    CREATE INDEX IF NOT EXISTS idx_digital_purchases_listing_id ON digital_purchases(listing_id);
    CREATE INDEX IF NOT EXISTS idx_boost_subscriptions_listing_id ON boost_subscriptions(listing_id);
  `);

  ensureColumn("users", "email", "TEXT UNIQUE");
  ensureColumn("users", "password_hash", "TEXT");
  ensureColumn("users", "role", "TEXT DEFAULT 'user'");
  ensureColumn("users", "seller_status", "TEXT DEFAULT 'active'");
  ensureColumn("users", "bank_account_name", "TEXT");
  ensureColumn("users", "bank_name", "TEXT");
  ensureColumn("users", "bank_iban", "TEXT");
  ensureColumn("users", "payout_notes", "TEXT");
  ensureColumn("users", "account_type", "TEXT DEFAULT 'user'");
  ensureColumn("users", "subscription_plan", "TEXT DEFAULT 'free'");
  ensureColumn("users", "subscription_status", "TEXT DEFAULT 'inactive'");
  ensureColumn("users", "subscription_expires_at", "TEXT");
  ensureColumn("users", "trusted_badge", "INTEGER DEFAULT 0");
  ensureColumn("users", "is_blocked", "INTEGER DEFAULT 0");
  ensureColumn("users", "is_verified", "INTEGER DEFAULT 0");

  ensureColumn("listings", "sold_price", "REAL");
  ensureColumn("listings", "boost_expires_at", "TEXT");
  ensureColumn("listings", "sponsor_home_expires_at", "TEXT");
  ensureColumn("listings", "allow_direct_buy", "INTEGER DEFAULT 0");
  ensureColumn("listings", "pinned_until", "TEXT");

  ensureColumn("boost_subscriptions", "source_purchase_id", "INTEGER");

  ensureColumn("digital_purchases", "listing_id", "INTEGER");
  ensureColumn("digital_purchases", "plan_key", "TEXT");
  ensureColumn("digital_purchases", "purchase_token", "TEXT UNIQUE");
  ensureColumn("digital_purchases", "order_ref", "TEXT");
  ensureColumn("digital_purchases", "duration_days", "INTEGER DEFAULT 0");
  ensureColumn("digital_purchases", "currency", "TEXT DEFAULT 'ILS'");
  ensureColumn("digital_purchases", "starts_at", "TEXT");
  ensureColumn("digital_purchases", "ends_at", "TEXT");
  ensureColumn("digital_purchases", "metadata_json", "TEXT");

  db.exec(`
    UPDATE listings SET allow_direct_buy = 0 WHERE allow_direct_buy IS NULL OR allow_direct_buy != 0;
    UPDATE users SET role = 'user' WHERE role IS NULL OR role != 'user';
    UPDATE users SET account_type = 'user' WHERE account_type IS NULL OR account_type != 'user';
  `);
}

function resetAllData() {
  const tables = [
    "admins",
    "users",
    "categories",
    "cities",
    "listings",
    "listing_images",
    "favorites",
    "reports",
    "notifications",
    "user_push_tokens",
    "otp_codes",
    "conversations",
    "messages",
    "offers",
    "boost_subscriptions",
    "digital_purchases",
    "orders",
    "transactions",
    "settings",
  ];

  db.exec("BEGIN");
  try {
    for (const table of tables) db.prepare(`DELETE FROM ${table}`).run();
    db.prepare("DELETE FROM sqlite_sequence").run();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

module.exports = { db, initSchema, resetAllData };
