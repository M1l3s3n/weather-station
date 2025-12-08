import { useState, useEffect } from "react";
import "./App.css";
import MapCard from "./components/MapCard";
import InfoCard from "./components/InfoCard";
import AirQuality from "./components/AirQuality";

const API_BASE = `${window.location.origin}/api`;

export default function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch(`${API_BASE}/latest`);
        const data = await res.json();

        let stationObject;

        if (data && data.status === "ok" && data.data) {
          stationObject = data.data;
        } else {
          stationObject = data;
        }

        if (stationObject && !stationObject._id) {
          stationObject._id = "main-station";
        }

        const stationsArray = stationObject ? [stationObject] : [];

        setStations(stationsArray);
      } catch (err) {
        console.error("Помилка завантаження:", err);
        setStations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
    const interval = setInterval(fetchStations, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (station) => {
    setSelectedStation(station);
    setSidebarOpen(true);
  };

  const selectedPosition = selectedStation
    ? [selectedStation.gps.lat, selectedStation.gps.lon]
    : null;

  return (
    <div className="backContainer">
      <header className="header">
        <h1>Екомоніторинг Львова</h1>
        <h3>{stations.length} активний пристрій</h3>
      </header>

      <div className="layout">
        <MapCard
          stations={stations}
          onSelect={handleSelect}
          sidebarOpen={sidebarOpen}
          selectedPosition={selectedPosition}
          loading={loading}
        />
        {sidebarOpen && (
          <InfoCard
            station={selectedStation}
            onClose={() => {
              setSidebarOpen(false);
              setSelectedStation(null);
            }}
          />
        )}
        <AirQuality />
      </div>
    </div>
  );
}
