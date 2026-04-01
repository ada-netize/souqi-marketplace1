function notFound(req, res) {
  return res.status(404).json({ message: "المسار غير موجود" });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  return res.status(500).json({
    message: err.message || "حدث خطأ غير متوقع",
  });
}

module.exports = { notFound, errorHandler };
