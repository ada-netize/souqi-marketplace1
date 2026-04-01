const express = require("express");
const cors = require("cors");
const path = require("path");
const { PORT, ROOT } = require("./config");
const { initSchema } = require("./lib/db");
const { notFound, errorHandler } = require("./middleware/error");

initSchema();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(ROOT, "uploads")));

app.get("/", (req, res) => {
  res.json({ app: "Souqi Marketplace API", status: "ok" });
});

app.use("/api/public", require("./routes/public"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/admin", require("./routes/admin"));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
  console.log(`Local test: http://localhost:${PORT}/api/public/health`);
  console.log(`LAN test:   http://YOUR-IP:${PORT}/api/public/health`);
});
