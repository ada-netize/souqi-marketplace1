const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const DB_PATH = path.join(DATA_DIR, "souqi_marketplace_v2.db");
const JWT_SECRET = "souqi_marketplace_local_secret";
const PORT = 5000;

module.exports = {
  ROOT,
  DATA_DIR,
  UPLOADS_DIR,
  DB_PATH,
  JWT_SECRET,
  PORT,
};
