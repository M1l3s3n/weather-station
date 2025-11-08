const SensorData = require("../models/SensorData");

const saveSensorData = async (req, res) => {
  try {
    console.log("Отримані дані від ESP32: ", req.body);

    const requiredFields = [
      "temperature",
      "humidity",
      "pressure",
      "co2",
      "co",
      "gps",
    ];
    for (const f of requiredFields) {
      if (req.body[f] === undefined) {
        return res.status(400).json({
          status: "error",
          message: `Відсутнє поле: ${f}`,
        });
      }
    }
    if (
      !req.body.gps ||
      req.body.gps.lat === undefined ||
      req.body.gps.lon === undefined
    ) {
      return res.status(400).json({
        status: "error",
        message: "Поле gps має містити lat і lon",
      });
    }

    const newData = new SensorData(req.body);
    await newData.save();

    res.status(201).json({
      status: "ok",
      message: "Дані успішно збережені",
      id: newData._id,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

const getLatestData = async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ createdAt: -1 });

    if (!latest) {
      return res.status(404).json({
        status: "error",
        message: "Дані не знайдені",
      });
    }

    res.json(latest);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const history = await SensorData.find({
      createdAt: { $gte: oneDayAgo },
    }).sort({ createdAt: 1 });

    res.json({
      status: "ok",
      count: history.length,
      data: history,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

const getStats = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stats = await SensorData.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo } } },
      {
        $group: {
          _id: null,
          avgTemp: { $avg: "$temperature" },
          maxTemp: { $max: "$temperature" },
          minTemp: { $min: "$temperature" },
          avgHumidity: { $avg: "$humidity" },
          avgCO2: { $avg: "$co2" },
        },
      },
    ]);

    res.json(stats[0] || {});
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

module.exports = {
  saveSensorData,
  getLatestData,
  getHistory,
  getStats,
};
