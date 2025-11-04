const errorHandler = (err, req, res, next) => {
  console.error("❌ Помилка:", err.stack);

  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Внутрішня помилка сервера",
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
