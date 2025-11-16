import { useEffect, useState, useMemo } from "react";
import { analyzeWeather } from "./utils/weatherUtils";
import { formatUkrainianDate } from "./utils/dateUtils";
import WeatherCard from "./components/WeatherCard";
import PressureCard from "./components/PressureCard";
import MapCard from "./components/MapCard";
import useOpenMeteoForecast from "./hooks/useOpenMeteoForecast";
import HourlyForecast from "./components/HourlyForecast";
import AirWindCard from "./components/AirWindCard";
import WeatherPreloader from "./components/WeatherPreloader";
import "./App.css";

const API_BASE = `${window.location.origin}/api`;

export default function App() {
  const [data, setData] = useState(null);
  const [meteoData, setMeteoData] = useState(null);
  const [pressureData, setPressureData] = useState(null);
  const [mapData, setMapData] = useState(null);

  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingPressure, setLoadingPressure] = useState(true);
  const [loadingMeteo, setLoadingMeteo] = useState(true);
  const [error, setError] = useState(null);

  const { forecast, loading: forecastLoading } = useOpenMeteoForecast(
    mapData?.lat,
    mapData?.lon
  );

  // === ЗАВАНТАЖЕННЯ ОСНОВНИХ ДАНИХ ===
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_BASE}/latest`);
        if (!res.ok) throw new Error("Сервер недоступний");
        const json = await res.json();

        setData(json);
        setMapData({ lat: json.gps.lat, lon: json.gps.lon });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingLatest(false);
      }
    };

    const fetchPressure = async () => {
      try {
        const res = await fetch(`${API_BASE}/pressureHourly`);
        if (!res.ok) throw new Error("Тиск недоступний");
        const json = await res.json();
        const pressure = json.data[json.data.length - 1]?.pressure || 0;
        const history = json.data.map((d) => d.pressure);

        setPressureData({ pressure, history });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPressure(false);
      }
    };

    fetchLatest();
    fetchPressure();

    const intervalLatest = setInterval(fetchLatest, 60000);
    const intervalPressure = setInterval(fetchPressure, 60000);

    return () => {
      clearInterval(intervalLatest);
      clearInterval(intervalPressure);
    };
  }, []);

  // === МЕТЕО (вітер, UV) ===
  useEffect(() => {
    if (!data?.gps?.lat || !data?.gps?.lon) return;

    const fetchMeteo = async () => {
      setLoadingMeteo(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${data.gps.lat}&longitude=${data.gps.lon}&current=uv_index,windspeed_10m`
        );
        if (!res.ok) throw new Error("Open-Meteo недоступний");
        const json = await res.json();

        const windSpeed = json.current?.windspeed_10m?.toFixed(1) || 0;
        setMeteoData({
          current: {
            uv_index: json.current?.uv_index?.toFixed(1) || "0",
            windspeed_10m: windSpeed,
          },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMeteo(false);
      }
    };

    fetchMeteo();
    const interval = setInterval(fetchMeteo, 600000);
    return () => clearInterval(interval);
  }, [data?.gps?.lat, data?.gps?.lon]);

  // === ПОГОДА з useMemo (оптимізація) ===
  const weather = useMemo(() => {
    if (!data || !pressureData || !meteoData?.current?.windspeed_10m)
      return null;

    return analyzeWeather(
      data.temperature,
      data.humidity,
      data.rain,
      pressureData.pressure,
      meteoData.current.windspeed_10m
    );
  }, [data, pressureData, meteoData]);

  // === ЧЕКАЄМО ВСІХ ДАНИХ ===
  const isLoading =
    loadingLatest ||
    loadingPressure ||
    loadingMeteo ||
    forecastLoading ||
    !data ||
    !pressureData ||
    !meteoData ||
    !forecast;

  // === ПОМИЛКА ===
  if (error) {
    return (
      <WeatherPreloader isLoading={true}>
        <div style={{ textAlign: "center", color: "#ff6b6b" }}>
          <h3>Помилка підключення</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
            }}
          >
            Оновити
          </button>
        </div>
      </WeatherPreloader>
    );
  }

  return (
    <>
      {/* PRELOADER */}
      <WeatherPreloader isLoading={isLoading} />

      {/* ОСНОВНИЙ КОНТЕНТ */}
      {!isLoading && weather && (
        <div className="mainContainer">
          <img
            src={weather?.background}
            alt="Weather background"
            className="weather-background"
            loading="lazy"
            fetchPriority="low"
          />
          <section className="topContainer">
            <div className="basicInfo">
              <div className="basicInfoBox">
                <div className="basicInfoWeather">{weather.status}</div>
                <div className="basicInfoTemperature">{data.temperature}°C</div>
                <div className="basicInfoDayToday">
                  {formatUkrainianDate(data.createdAt)}
                </div>
              </div>
            </div>
            <div className="weatherIcon">
              <img
                src={weather.icon}
                alt={weather.status}
                className="weatherIconImage"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </section>

          <section className="cardsContainer">
            <WeatherCard data={data} />
            <PressureCard data={pressureData} />
            <MapCard data={mapData} />
            <HourlyForecast data={forecast} />
            <AirWindCard
              espData={{ co: data.co, co2: data.co2 }}
              meteoData={meteoData}
            />
          </section>
        </div>
      )}
    </>
  );
}
