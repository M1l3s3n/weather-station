import "./cardsStyles.css";
import coIcon from "../assets/forecast-icons/co.png";
import co2Icon from "../assets/forecast-icons/co2.png";
import uvIcon from "../assets/forecast-icons/uv.png";
import windIcon from "../assets/forecast-icons/wind.png";

export default function AirWindCard({ espData, meteoData, loading }) {
  if (loading) {
    return <div className="air-wind-card">Завантаження...</div>;
  }

  if (!espData && !meteoData) {
    return <div className="air-wind-card">Немає даних</div>;
  }

  const co = espData?.co ?? "-";
  const co2 = espData?.co2 ?? "-";
  const uvIndex = meteoData?.current?.uv_index ?? "-";
  const windSpeed = meteoData?.current?.windspeed_10m ?? "-";

  return (
    <div className="air-wind-card">
      {/* CO */}
      <div className="air-item co-item">
        <div className="air-label">
          <img src={coIcon} alt="CO" />
          CO
        </div>
        <div className="air-value">{co} ppm</div>
      </div>

      {/* CO₂ */}
      <div className="air-item co2-item">
        <div className="air-label">
          <img src={co2Icon} alt="CO2" />
          CO₂
        </div>
        <div className="air-value">{co2} ppm</div>
      </div>

      {/* UV Index */}
      <div className="air-item uv-item">
        <div className="air-label">
          <img src={uvIcon} alt="UV" />
          UV Index
        </div>
        <div className="air-value">{uvIndex}</div>
      </div>

      {/* Wind Speed */}
      <div className="air-item wind-item">
        <div className="air-label">
          <img src={windIcon} alt="Вітер" />
          Вітер
        </div>
        <div className="air-value">{windSpeed} км/год</div>
      </div>
    </div>
  );
}
