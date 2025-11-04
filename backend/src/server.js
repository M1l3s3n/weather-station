const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const apiRoutes = require("./routes/api");
const errorHandler = require("./middleware/errorHandler");

// Налаштування
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Підключення до MongoDB
connectDB();

// Routes
app.use("/api", apiRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "🚀 Сервер запущено!",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Маршрут не знайдено",
  });
});

// Error handler
app.use(errorHandler);

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 МЕТЕОСТАНЦІЯ API ЗАПУЩЕНА          ║
║  📍 http://localhost:${PORT}              ║
║                                        ║
║  API Endpoints:                        ║
║  📡 POST /api/sensor                   ║
║  📊 GET /api/latest                    ║
║  📈 GET /api/history                   ║
║  📉 GET /api/stats                     ║
║  ❤️  GET /health                        ║
╚════════════════════════════════════════╝
  `);
});
