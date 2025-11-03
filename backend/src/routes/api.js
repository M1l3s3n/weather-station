import express from "express";
import SensorData from "../models/SensorData.js";

const router = express.Router();

// Отримати всі дані
router.get("/", async (req, res) => {
  try {
    const data = await SensorData.find().sort({ createdAt: -1 }).limit(100);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ESP32 відправляє POST з даними датчиків
router.post("/", async (req, res) => {
  try {
    const sensorData = new SensorData(req.body);
    await sensorData.save();
    res.status(201).json({ message: "Data saved successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
