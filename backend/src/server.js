const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const apiRoutes = require("./routes/api");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// connectDB();

app.use("/api", apiRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "🚀 Сервер запущено!",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Маршрут не знайдено",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const start = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
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

    const shutdown = async (signal) => {
      console.log(`\nОтримано ${signal}. Закриваю сервер...`);
      server.close(async () => {
        try {
          await mongoose.disconnect();
          console.log("MongoDB відключено");
          process.exit(0);
        } catch (err) {
          console.error("Помилка при відключенні:", err);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error("Примусове завершення");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("Не вдалося стартувати сервер:", err);
    process.exit(1);
  }
};

start();
