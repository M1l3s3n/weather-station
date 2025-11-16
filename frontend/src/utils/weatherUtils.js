import sunny from "../assets/icons/sunny.webp";
import rainy from "../assets/icons/rainy.webp";
import hot from "../assets/icons/hot.webp";
import foggy from "../assets/icons/foggy.webp";
import snowy from "../assets/icons/snowy.webp";
import severeStorm from "../assets/icons/severe-storm.webp";

export const analyzeWeather = (temp, humidity, rain, pressure, windSpeed) => {
  let icon, status, background;

  // 1. ГРОЗА (дощ + вітер + високий тиск)
  if (rain && windSpeed > 15 && pressure > 1015) {
    icon = severeStorm;
    status = "Гроза";
    background = "/images/storm.webp";
  }
  // 2. СИЛЬНИЙ ДОЩ (дощ + тепло)
  else if (rain && temp > 15) {
    icon = rainy;
    status = "Злива";
    background = "/images/heavy-rainy.webp";
  }
  // 3. ЛЕГКИЙ ДОЩ
  else if (rain) {
    icon = rainy;
    status = "Дощ";
    background = "/images/light-rain.webp";
  }
  // 4. СНІГОПАД (холод + вологість)
  else if (temp < 0 && humidity > 75) {
    icon = snowy;
    status = "Снігопад";
    background = "/images/snowfall.webp";
  }
  // 5. СНІГ
  else if (temp < 0) {
    icon = snowy;
    status = "Сніг";
    background = "/images/snow.webp";
  }
  // 6. МОРОЗ (дуже холодно)
  else if (temp < -10) {
    icon = snowy;
    status = "Мороз";
    background = "/images/frost.webp";
  }
  // 7. СПЕКА (жара + CO2)
  else if (temp > 30) {
    icon = hot;
    status = "Спека";
    background = "/images/hot.webp";
  }
  // 8. ТУМАН (вологість + низький вітер)
  else if (humidity > 90 && windSpeed < 5) {
    icon = foggy;
    status = "Туман";
    background = "/images/foggy.webp";
  }
  // 9. ПОХМУРО (середня температура + вологість)
  else if (temp > 5 && temp <= 18 && humidity > 65) {
    icon = sunny;
    status = "Похмуро";
    background = "/images/overcast.webp";
  }
  // 10. ЧАСТКОВО ХМАРНО
  else if (temp > 18 && humidity > 50) {
    icon = sunny;
    status = "Мінлива хмарність";
    background = "/images/partly-cloudy.webp";
  }
  // 11. СОНЯЧНО (за замовчуванням)
  else {
    icon = sunny;
    status = "Сонячно";
    background = "/images/sunny.webp";
  }

  return { icon, status, background };
};
