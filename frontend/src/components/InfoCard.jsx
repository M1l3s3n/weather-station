import React, { useState, useEffect } from "react";
import { getAirQuality } from "../utils/airQuality";

export default function InfoCard({ station, onClose, sidebarOpen }) {
  if (!station) return null;

  const aq = getAirQuality(station.co2);

  const [address, setAddress] = useState("Завантаження адреси...");
  const [addressError, setAddressError] = useState(false);

  useEffect(() => {
    if (!station.gps?.lat || !station.gps?.lon) {
      setAddress("Координати відсутні");
      return;
    }

    const cacheKey = `${station.gps.lat.toFixed(6)},${station.gps.lon.toFixed(
      6
    )}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setAddress(cached);
      return;
    }

    const fetchAddress = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${station.gps.lat}&lon=${station.gps.lon}&zoom=18&addressdetails=1&accept-language=uk`
        );

        if (!res.ok) throw new Error("Network error");

        const data = await res.json();

        let displayName = "Адреса не знайдена";

        if (data && data.display_name) {
          const parts = [];
          if (data.address?.road) parts.push(data.address.road);
          if (data.address?.house_number) parts.push(data.address.house_number);
          if (data.address?.suburb) parts.push(data.address.suburb);
          else if (data.address?.village) parts.push(data.address.village);
          else if (data.address?.city_district)
            parts.push(data.address.city_district);

          displayName =
            parts.length > 0
              ? parts.join(", ")
              : data.display_name.split(",")[0];
        }

        setAddress(displayName);
        sessionStorage.setItem(cacheKey, displayName);
      } catch (err) {
        console.error("Не вдалося отримати адресу:", err);
        setAddress("Локація (GPS)");
        setAddressError(true);
      }
    };

    fetchAddress();
  }, [station.gps?.lat, station.gps?.lon]);

  return (
    <aside className={`infoSidebar ${sidebarOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose} aria-label="Закрити">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="infoHeader">
        <h2>Екостанція</h2>
        <h4>
          {addressError ? (
            <span style={{ color: "#aaa", fontStyle: "italic" }}>
              {station.gps.lat.toFixed(5)}, {station.gps.lon.toFixed(5)}
            </span>
          ) : (
            address
          )}
        </h4>
        <div className="status-bar" style={{ border: `1px solid ${aq.color}` }}>
          <span
            className="status-dot"
            style={{ backgroundColor: aq.color }}
          ></span>
          Якість повітря: <h4>{aq.label}</h4>
        </div>
      </div>

      <h3>Показники датчиків:</h3>
      <ul className="infoList">
        <li>
          <strong>Вуглекислий газ (CO₂)</strong>
          <div className="value-big">
            {station.co2} <small>ppm</small>
          </div>
        </li>
        <li>
          <strong>Чадний газ (CO)</strong>
          <div className="value-big">
            {station.co || "—"} <small>ppm</small>
          </div>
        </li>
        <li>
          <strong>Температура</strong>
          <div className="value-big">
            {station.temperature} <small>°C</small>
          </div>
        </li>
        <li>
          <strong>Опади</strong>
          <div className="value-big">
            {station.rain ? (
              <span style={{ color: "#ffffffff" }}>Падає дощ</span>
            ) : (
              <span style={{ color: "#ccc" }}>Без опадів</span>
            )}
          </div>
        </li>
        <li>
          <strong>Тиск</strong>
          <div className="value-big">
            {station.pressure} <small>hPa</small>
          </div>
        </li>
        <li>
          <strong>Вологість</strong>
          <div className="value-big">
            {station.humidity} <small>%</small>
          </div>
        </li>
      </ul>
    </aside>
  );
}
