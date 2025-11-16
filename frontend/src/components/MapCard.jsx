import { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./cardsStyles.css";

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapResize({ center }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 150);
  }, [center, map]);
  return null;
}

export default function MapCard({ data, loading }) {
  const [address, setAddress] = useState("");
  const [coordsStr, setCoordsStr] = useState("");
  const abortControllerRef = useRef(null);

  const lat = data?.lat ?? null;
  const lon = data?.lon ?? null;

  const center = useMemo(() => {
    if (lat == null || lon == null) return [49.84, 24.03];
    return [lat, lon];
  }, [lat, lon]);

  // Показуємо координати одразу (синхронно)
  useEffect(() => {
    if (lat == null || lon == null) return;
    const latStr =
      lat >= 0 ? `${lat.toFixed(4)}° N` : `${Math.abs(lat).toFixed(4)}° S`;
    const lonStr =
      lon >= 0 ? `${lon.toFixed(4)}° E` : `${Math.abs(lon).toFixed(4)}° W`;
    setCoordsStr(`${latStr}, ${lonStr}`);

    // Показуємо координати як адресу поки завантажується реальна адреса
    setAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
  }, [lat, lon]);

  // Геокодинг адреси — АСИНХРОННО з затримкою (не блокує критичний шлях)
  useEffect(() => {
    if (lat == null || lon == null) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchAddress = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=uk`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();

        if (!json.address || Object.keys(json.address).length === 0) {
          setAddress("Поза населеним пунктом");
          return;
        }

        const { road, house_number, suburb, village, town, city, country } =
          json.address;
        const location = city || town || village || country || "Невідомо";
        const street = road
          ? `${road}${house_number ? `, ${house_number}` : ""}`
          : suburb || "вулиця невідома";

        setAddress(`${location}, ${street}`);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Geocoding error:", err);
          // Залишаємо координати як fallback
        }
      }
    };

    // Затримка 800мс перед запитом до Nominatim (не блокує LCP!)
    const timer = setTimeout(() => {
      fetchAddress();
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [lat, lon]);

  const mapKey =
    lat && lon ? `${lat.toFixed(6)}-${lon.toFixed(6)}` : "fallback";

  if (loading) return <div className="map-card">Завантаження...</div>;
  if (lat == null || lon == null)
    return <div className="map-card">Немає координат</div>;

  return (
    <div className="map-card">
      <div className="map-header">
        <span className="map-address-title">{address}</span>
      </div>

      <div className="map-container">
        <MapContainer
          key={mapKey}
          center={center}
          zoom={16}
          minZoom={12}
          maxZoom={18}
          scrollWheelZoom="center"
          doubleClickZoom={false}
          dragging={false}
          zoomControl={false}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
          className="leafletMap"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            opacity={0.8}
          />
          <Marker position={center} icon={redIcon}>
            <Popup>{address}</Popup>
          </Marker>
          <MapResize center={center} />
        </MapContainer>
      </div>

      <div className="map-coords">{coordsStr}</div>
    </div>
  );
}
