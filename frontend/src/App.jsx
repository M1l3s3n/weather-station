import { useEffect, useState } from "react";
import { analyzeWeather } from "./utils/weatherUtils";
import WeatherCard from "./components/WeatherCard";
import PressureCard from "./components/PressureCard";
// import AirQualityCard from './components/AirQualityCard'
// import MapCard from './components/MapCard'
// import TemperatureChart from './components/TemperatureChart'
// import { getLatestData, getHistory } from './services/api'
import cloudy from "./assets/icons/cloudy.png";
import "./App.css";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);

  const pressureData = {
    pressure: 30.12,
    history: [29.95, 29.98, 15.01, 30.05, 40.08, 30.1, 30.12, 1.15],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/latest"); //! внести в змінну юрл і ендпоінт

        if (!res.ok) throw new Error("Помилка підключення");

        const json = await res.json();

        console.log(json); //!не забути видалити

        setData(json);

        const weatherData = analyzeWeather(
          json.temperature,
          json.humidity,
          json.rain
        );
        setWeather(weatherData);

        setError(null);
      } catch (err) {
        console.error("Помилка:", err);
        setError("Не вдалось підключитись до сервера");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 500000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return (
    <div
      className="mainContainer"
      style={{
        backgroundImage: `url('${weather?.background}')`,
      }}
    >
      <section className="topContainer">
        <div className="basicInfo">
          <div className="basicInfoBox">
            <div className="basicInfoWeather">
              {loading ? "Завантаження..." : weather?.status}
            </div>
            <div className="basicInfoTemperature">
              {loading ? "..." : data?.temperature}°C
            </div>

            <div className="basicInfoDayToday">
              {loading
                ? "..."
                : new Date(data?.createdAt).toLocaleDateString("uk-UA", {
                    weekday: "long",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
            </div>
          </div>
        </div>
        <div className="weatherIcon">
          {loading ? (
            <div style={{ fontSize: "8rem" }}>⏳</div>
          ) : (
            <img
              src={weather?.icon}
              alt={weather?.status}
              className="weatherIconImage"
            />
          )}
        </div>
      </section>
      <section className="cardsContainer">
        <WeatherCard data={data} loading={loading} />
        <PressureCard data={pressureData} loading={false} />
      </section>
    </div>
  );
}
