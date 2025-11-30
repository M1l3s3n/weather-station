import "./cardsStyles.css";
import pressureIcon from "../assets/forecast-icons/pressure.png";
import dropIcon from "../assets/forecast-icons/drop.png";
import { LineChart, Line, YAxis } from "recharts";

export default function PressureCard({ data, loading }) {
  if (loading) return <div className="pressure-card">Завантаження...</div>;
  if (!data) return <div className="pressure-card">Немає даних</div>;

  const { pressure, history = [] } = data;

  const minPressure = Math.min(...history);

  const chartData = history.map((value, index) => ({
    value: Number((value - minPressure).toFixed(3)),
    index,
  }));

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.index === 0 || payload.index === history.length - 1) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#18f8ff"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  return (
    <div className="pressure-card">
      <div className="pressure-text">
        <img src={pressureIcon} alt="Тиск" />
        Тиск:
      </div>

      <div className="pressure-value">
        <img src={dropIcon} alt="Крапля" />
        {pressure.toFixed(2)}
        <span className="unit">hPa</span>
      </div>

      <div className="pressure-chart">
        <LineChart
          width={671}
          height={80}
          data={chartData}
          margin={{ top: 10, right: 25, bottom: 30, left: 25 }}
        >
          <YAxis hide={true} domain={["dataMin - 0.05", "dataMax + 0.05"]} />
          <Line
            type="monotoneX"
            dataKey="value"
            stroke="#18f8ff"
            strokeWidth={3}
            dot={<CustomDot />}
            isAnimationActive={true}
            animationDuration={1500}
          />
        </LineChart>

        <div className="pressure-labels">
          {history.map((val, i) => (
            <span key={i}>{val.toFixed(2)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
