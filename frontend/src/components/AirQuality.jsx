import React from "react";

const levels = [
  { color: "#78FF8A", label: "Відмінна" },
  { color: "#D6F01F", label: "Добра" },
  { color: "#FFB84D", label: "Помірна" },
  { color: "#FF5C5C", label: "Погана" },
];

export default function AirQuality() {
  return (
    <div className="air-legend">
      <ul className="air-legend-list">
        {levels.map((item) => (
          <li key={item.label} className="air-legend-item">
            <span
              className="air-legend-dot"
              style={{ backgroundColor: item.color }}
            />
            <div className="air-legend-text">
              <span className="label">{item.label}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
