import "./cardsStyles.css";
import heart from "../assets/forecast-icons/heart.png";
import temperatureIcon from "../assets/forecast-icons/temperature.png";
import humidityIcon from "../assets/forecast-icons/humidity.png";

export default function WeatherCard({ data, loading }) {
  if (loading) {
    return <div className="weather-card">Завантаження...</div>;
  }

  if (!data) {
    return <div className="weather-card">Немає даних</div>;
  }

  const { temperature, humidity } = data;

  return (
    <div className="weather-card">
      <div className="temperature-main">
        <div className="temperature-text">
          <img src={heart} alt="Іконка" />
          Температура:
        </div>
        <div className="temperature">
          <img src={temperatureIcon} alt="Температура" />
          {temperature}°C
        </div>
      </div>
      <div className="humidity-main">
        <div className="humidity-text">
          <img src={humidityIcon} alt="Вологість" />
          Вологість:
        </div>
        <div className="humidity">{humidity}%</div>
      </div>
    </div>
  );
}
