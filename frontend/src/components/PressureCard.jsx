import "./cardsStyles.css";
import pressureIcon from "../assets/forecast-icons/pressure.png"; // додай іконку барометра
import dropIcon from "../assets/forecast-icons/drop.png"; // крапля як на твоєму фото

export default function PressureCard({ data, loading }) {
  if (loading) {
    return <div className="pressure-card">Завантаження...</div>;
  }

  if (!data) {
    return <div className="pressure-card">Немає даних</div>;
  }

  const { pressure, history = [] } = data; // history — масив останніх 8 значень

  return (
    <div className="pressure-card">
      <div className="pressure-main">
        <div className="pressure-text">
          <img src={pressureIcon} alt="Тиск" />
          Тиск:
        </div>
        <div className="pressure-value">
          <img src={dropIcon} alt="Крапля" />
          {pressure.toFixed(2)}
          <span className="unit">Hg</span>
        </div>
      </div>

      <div className="pressure-chart">
        <div className="sparkline">
          {history.map((val, idx) => (
            <div
              key={idx}
              className="sparkline-bar"
              style={{
                height: `${
                  ((val - Math.min(...history)) /
                    (Math.max(...history) - Math.min(...history) || 1)) *
                    80 +
                  20
                }%`,
              }}
            />
          ))}
        </div>
        <div className="pressure-labels">
          {history.map((val, idx) => (
            <span key={idx}>{val.toFixed(1)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
