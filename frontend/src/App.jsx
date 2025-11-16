import { useEffect, useState } from "react";
import { analyzeWeather } from "./utils/weatherUtils";
import WeatherCard from "./components/WeatherCard";
import PressureCard from "./components/PressureCard";
import MapCard from "./components/MapCard";
import useOpenMeteoForecast from "./hooks/useOpenMeteoForecast";
import HourlyForecast from "./components/HourlyForecast";
import cloudy from "./assets/icons/cloudy.png";
import "./App.css";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [pressureData, setPressureData] = useState(null);
  const [mapData, setMapData] = useState(null);
  const { forecast, loading: forecastLoading } = useOpenMeteoForecast(
    mapData?.lat,
    mapData?.lon
  );

  useEffect(() => {
    const fetchPressure = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/pressureHourly");
        if (!res.ok) throw new Error("Помилка підключення тиску");
        const json = await res.json();

        const dataForCard = {
          pressure: json.data[json.data.length - 1]?.pressure || 0,
          history: json.data.map((item) => item.pressure),
        };

        setPressureData(dataForCard);
      } catch (err) {
        console.error("Помилка при завантаженні тиску:", err);
        setPressureData(null);
      }
    };

    fetchPressure();

    const interval = setInterval(fetchPressure, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/latest"); //! внести в змінну юрл і ендпоінт

        if (!res.ok) throw new Error("Помилка підключення");

        const json = await res.json();

        console.log(json); //!не забути видалити

        setData(json);
        setMapData({ lat: json.gps.lat, lon: json.gps.lon });

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

    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
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
        <PressureCard
          data={pressureData || { pressure: 0, history: [] }}
          loading={!pressureData}
        />
        <MapCard
          data={mapData || { lat: 49.84, lon: 24.03 }}
          loading={loading}
        />
        <HourlyForecast data={forecast} loading={forecastLoading} />
      </section>
    </div>
  );
}
