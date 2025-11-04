const express = require("express");
const router = express.Router();
const {
  saveSensorData,
  getLatestData,
  getHistory,
  getStats,
} = require("../controllers/sensorController");

// POST /api/sensor - від ESP32
router.post("/sensor", saveSensorData);

// GET /api/latest - останні дані
router.get("/latest", getLatestData);

// GET /api/history - за 24 години
router.get("/history", getHistory);

// GET /api/stats - статистика
router.get("/stats", getStats);

module.exports = router;
