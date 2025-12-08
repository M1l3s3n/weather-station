import { useState, useEffect } from "react";
import "./App.css";
import MapCard from "./components/MapCard";
import InfoCard from "./components/InfoCard";
import AirQuality from "./components/AirQuality";

// const API_BASE = `${window.location.origin}/api`;
const API_BASE = "https://weather-station-5qp7.onrender.com/api";

export default function App() {
  const [station, setStation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStation = async () => {
    try {
      const res = await fetch(`${API_BASE}/latest`);
      const data = await res.json();

      let stationObject = data?.data || data;

      if (stationObject && !stationObject._id) {
        stationObject._id = "main-station";
      }

      if (stationObject) {
        setStation({ ...stationObject });
      } else {
        setStation(null);
      }
    } catch (err) {
      console.error("Помилка завантаження:", err);
      setStation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStation();
    const interval = setInterval(fetchStation, 15000);
    return () => clearInterval(interval);
  }, []);

  const selectedPosition = station ? [station.gps.lat, station.gps.lon] : null;

  return (
    <div className="backContainer">
      <header className="header">
        <h1>Екомоніторинг Львова</h1>
        <h3>{station ? "1 активний пристрій" : "0 активних пристроїв"}</h3>
      </header>

      <div className="layout">
        <MapCard
          stations={station ? [station] : []}
          onSelect={() => setSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
          selectedPosition={selectedPosition}
          loading={loading}
        />
        {sidebarOpen && station && (
          <InfoCard
            station={station}
            onClose={() => setSidebarOpen(false)}
            sidebarOpen={sidebarOpen}
          />
        )}
        <AirQuality />
      </div>
    </div>
  );
}
