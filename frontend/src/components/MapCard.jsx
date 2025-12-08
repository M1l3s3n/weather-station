import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getAirQuality } from "../utils/airQuality";
import { createColoredIcon } from "../utils/createColoredIcon";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function ResizeMapOnSidebar({ sidebarOpen }) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [sidebarOpen, map]);

  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 0.8 });
  }, [position, map]);
  return null;
}

export default function MapCard({
  stations,
  onSelect,
  sidebarOpen,
  selectedPosition,
  loading,
}) {
  const wrapperStyle = {
    width: sidebarOpen ? "calc(100% - 20vw)" : "100%",
    height: "100vh",
    transition: "width 300ms ease",
  };

  if (loading) {
    return (
      <div className="mapWrapper" style={wrapperStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <p>Завантаження карти...</p>
        </div>
      </div>
    );
  }

  const center =
    stations.length > 0
      ? [stations[0].gps.lat, stations[0].gps.lon]
      : [49.8397, 24.0297];

  return (
    <div className="mapWrapper" style={wrapperStyle}>
      <MapContainer
        center={center}
        zoom={15}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution=""
          url="https://tile.jawg.io/jawg-matrix/{z}/{x}/{y}{r}.png?access-token=CJ0RsoOXQWWfAcAskbF3tzW5FmMlp2hbbFGTpKyaPfSyAUICAKwCzV0ntLpr4324"
        />

        {stations.map((s) => {
          const aq = getAirQuality(s.co2);
          return (
            <Marker
              key={s._id || "main-station"}
              position={[s.gps.lat, s.gps.lon]}
              icon={createColoredIcon(aq.color)}
              eventHandlers={{
                click: () => onSelect(s),
              }}
            >
              <Popup>
                <strong>{s.location || "Екостанція"}</strong>
                <br />
                CO₂: {s.co2} ppm ({aq.label})
                <br />
                Температура: {s.temperature}°C
              </Popup>
            </Marker>
          );
        })}
        <ResizeMapOnSidebar sidebarOpen={sidebarOpen} />
        <FlyTo position={selectedPosition} />
      </MapContainer>
    </div>
  );
}
