const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI не налаштовано в .env");
  process.exit(1);
}

let connectionAttempts = 0;
const MAX_ATTEMPTS = 5;
const RETRY_DELAY = 5000;

const connectDB = async () => {
  try {
    if (connectionAttempts >= MAX_ATTEMPTS) {
      console.error("Максимум спроб підключення досягнуто. Сервер зупинено.");
      process.exit(1);
    }

    connectionAttempts++;

    console.log(`\n Спроба підключення #${connectionAttempts}...`);

    await mongoose.connect(process.env.MONGODB_URI, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("MongoDB успішно підключена");
    connectionAttempts = 0;

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB розірвала зв'язок");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB помилка: ", err.message);
    });
  } catch (err) {
    console.error(
      `Помилка підключення (#${connectionAttempts}): ${err.message}`
    );

    if (connectionAttempts < MAX_ATTEMPTS) {
      console.log(`Повторна спроба через ${RETRY_DELAY / 1000} сек...`);
      setTimeout(connectDB, RETRY_DELAY);
    } else {
      console.error("Не вдалось підключитись до MongoDB. Сервер зупинено.");
      process.exit(1);
    }
  }
};

module.exports = connectDB;
