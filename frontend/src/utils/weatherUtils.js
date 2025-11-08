import sunny from "../assets/icons/sunny.png";
import rainy from "../assets/icons/rainy.png";
import hot from "../assets/icons/hot.png";
// import storm from "../assets/icons/storm.png";
import foggy from "../assets/icons/foggy.png";
// import night from "../assets/icons/night.png";
import snowy from "../assets/icons/snowy.png";
import severeStorm from "../assets/icons/severe-storm.png";

// ! ОСНОВНА ФУНКЦІЯ

export const analyzeWeather = (temp, humidity, rain) => {
  let weatherType;
  let icon;
  let status;
  let background;

  // ГРОЗА З ДОЩЕМ + гарячо
  if (rain && temp > 20) {
    weatherType = "severe-storm";
    icon = severeStorm;
    status = "Грозовий дощ";
    background = "/images/severe-storm.png";
  }
  // ДОЩ зі снігом
  else if (rain && temp < 5) {
    weatherType = "snowy-rain";
    icon = snowy;
    status = "Сніг з дощем";
    background = "/images/snow.png";
  }
  // ПРОСТО ДОЩ
  else if (rain) {
    weatherType = "rainy";
    icon = rainy;
    status = "Дощ";
    background = "/images/rainy.png";
  }
  // ХОЛОДНО - СНІГ
  else if (temp < 0) {
    weatherType = "snowy";
    icon = snowy;
    status = "Сніг";
    background = "/images/snow.png";
  }
  // ДУЖЕ ЖАРКО - СПЕКА
  else if (temp > 30) {
    weatherType = "hot";
    icon = hot;
    status = "Спека";
    background = "/images/hot.png";
  }
  // ВОЛОГО - ТУМАН
  else if (humidity > 80) {
    weatherType = "foggy";
    icon = foggy;
    status = "Туман";
    background = "/images/foggy.png";
  }
  // ГАРЯЧО - СОНЦЕ
  else if (temp > 20) {
    weatherType = "sunny";
    icon = sunny;
    status = "Сонячно";
    background = "/images/sunny.png";
  }
  // НІЧ
  else {
    weatherType = "night";
    icon = night;
    status = "Ніч";
    background = "/images/night.png";
  }

  // * Повертаємо ВСЕ необхідне
  return {
    weatherType,
    icon,
    status,
    background,
  };
};
