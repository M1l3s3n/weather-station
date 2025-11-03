const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema({
  temperature: {
    type: Number,
    required: true,
    min: -40,
    max: 80,
  },
  humidity: {
    //ВОЛОГІСТЬ У ВІДСОТКАХ
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  pressure: {
    //ТИСК
    type: Number,
    required: true,
    min: 300,
    max: 1100,
  },
  rain: {
    type: Boolean,
    required: true,
    default: false,
  },
  co2: {
    type: Number,
    required: true,
    min: 0,
    max: 5000,
  },
  co: {
    //ЧАДНИЙ ГАЗ
    type: Number,
    required: true,
    min: 0,
    max: 1000,
  },
  gps: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lon: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

sensorDataSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SensorData", sensorDataSchema);
