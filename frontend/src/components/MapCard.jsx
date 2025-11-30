import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./cardsStyles.css";

// ЧЕРВОНА ІКОНКА
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapResize({ center }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 150);
  }, [center, map]);
  return null;
}

export default function MapCard({ data, loading }) {
  const [address, setAddress] = useState("Завантаження адреси...");
  const [coordsStr, setCoordsStr] = useState("");

  const lat = data?.lat ?? null;
  const lon = data?.lon ?? null;

  const center = useMemo(() => {
    if (lat == null || lon == null) return [49.84, 24.03];
    return [lat, lon];
  }, [lat, lon]);

  // Формат координат
  useEffect(() => {
    if (lat == null || lon == null) return;
    const latStr =
      lat >= 0 ? `${lat.toFixed(4)}° N` : `${Math.abs(lat).toFixed(4)}° S`;
    const lonStr =
      lon >= 0 ? `${lon.toFixed(4)}° E` : `${Math.abs(lon).toFixed(4)}° W`;
    setCoordsStr(`${latStr}, ${lonStr}`);
  }, [lat, lon]);

  // Reverse geocoding
  useEffect(() => {
    if (lat == null || lon == null) return;

    const fetchAddress = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
        );
        const json = await res.json();
        const { road, city, town, village, suburb } = json.address || {};

        const location = city || town || village || "Невідомо";
        const street = road || suburb || "Невідома вулиця";

        setAddress(`${location}, ${street}`);
      } catch (err) {
        setAddress("Львів, вул. Симона Петлюри");
      }
    };

    fetchAddress();
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
          onWheel={(e) => {
            if (e.ctrlKey) {
              e.preventDefault();
            }
          }}
        >
          {/* ЯСКРАВА КАРТА — ВСЕ ВИДИМО */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* ДОДАТКОВО: ЯСКРАВІ КОЛЬОРИ (парки, вода, дороги) */}
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
