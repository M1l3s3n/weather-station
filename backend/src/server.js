const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
connectDB();

// 📨 API Endpoints
app.post("/api/sensor", (req, res) => {
  console.log("📥 Дані від ESP32:", req.body);
  res.json({ status: "ok" });
});

app.get("/api/latest", (req, res) => {
  res.json({
    temperature: 22.5,
    humidity: 45.2,
    pressure: 1012.3,
    raining: false,
    co2_ppm: 420,
    co_ppm: 12,
    latitude: 49.8125,
    longitude: 24.0089,
    timestamp: Date.now(),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
});
