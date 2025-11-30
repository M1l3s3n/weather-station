import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis } from "recharts";
import "./cardsStyles.css";

const weatherIcons = {
  sunny: "☀️",
  partlyCloudy: "⛅",
  cloudy: "☁️",
  rain: "🌧️",
  storm: "⛈️",
};

export default function HourlyForecast({ data = [], loading = false }) {
  const hours = useMemo(() => {
    return data.map((item) => ({
      time: item.time,
      temp: item.temp,
      icon: item.icon,
      isNow: item.isNow,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="hourly-forecast">
        <div className="forecast-loading">Завантаження...</div>
      </div>
    );
  }

  if (!hours.length) {
    return (
      <div className="hourly-forecast">
        <div className="forecast-empty">Немає даних</div>
      </div>
    );
  }

  const temps = hours.map((h) => h.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = maxTemp - minTemp || 1;

  const yDomain = [minTemp - 1, maxTemp + 1];

  return (
    <div className="hourly-forecast">
      <div className="forecast-header">12-годинний прогноз</div>

      <div className="forecast-chart">
        {/* === ГРАФІК БЕЗ ResponsiveContainer === */}
        <div className="forecast-graph-container">
          <LineChart
            width={1200} // ← ФІКСОВАНА ШИРИНА
            height={100} // ← ФІКСОВАНА ВИСОТА
            data={hours}
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient
                id="forecast-gradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#00ffff" />
                <stop offset="100%" stopColor="#0099ff" />
              </linearGradient>
            </defs>

            <YAxis domain={yDomain} hide />
            <XAxis dataKey="time" hide />

            <Line
              type="monotone"
              dataKey="temp"
              stroke="url(#forecast-gradient)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={true}
              animationDuration={1500}
            />
          </LineChart>

          {/* ТЕМПЕРАТУРИ */}
          <div className="forecast-temps-overlay">
            {hours.map((h, i) => {
              const x = (i / (hours.length - 1)) * 100;
              const yPercent = ((maxTemp - h.temp) / range) * 100;
              return (
                <div
                  key={`temp-${i}`}
                  className="forecast-temp-point"
                  style={{
                    left: `${x}%`,
                    top: `${yPercent * 0.5}%`,
                  }}
                >
                  <span className="forecast-temp">{h.temp}°</span>
                  {h.isNow && <div className="now-dot" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ІКОНКИ + ЧАС */}
        <div className="forecast-labels">
          {hours.map((h, i) => (
            <div key={`label-${i}`} className="forecast-label">
              <div className="forecast-icon">
                {weatherIcons[h.icon] || "☁️"}
              </div>
              <div className="forecast-time">{h.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
