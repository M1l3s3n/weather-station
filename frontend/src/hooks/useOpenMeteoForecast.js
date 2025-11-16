import { useEffect, useState } from "react";

const ICON_MAP = {
  0: "sunny",
  1: "partlyCloudy",
  2: "partlyCloudy",
  3: "cloudy",
  45: "cloudy",
  48: "cloudy",
  51: "rain",
  53: "rain",
  55: "rain",
  61: "rain",
  63: "rain",
  65: "rain",
  80: "rain",
  81: "rain",
  82: "rain",
  95: "storm",
  96: "storm",
  99: "storm",
};

export default function useOpenMeteoForecast(lat, lon) {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lat || !lon) return;

    const fetchForecast = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&forecast_days=2`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");

        const json = await res.json();

        const now = new Date();
        const currentHour = now.getHours();

        // === ЗНАХОДИМО ПОТОЧНУ ГОДИНУ В ДАНИХ ===
        const currentHourIndex = json.hourly.time.findIndex((time) => {
          const date = new Date(time);
          return (
            date.getHours() === currentHour && date.getDate() === now.getDate()
          );
        });

        // === БЕРЕМО 12 ГОДИН, ПОЧИНАЮЧИ З ПОТОЧНОЇ ===
        const hours = json.hourly.time
          .slice(currentHourIndex, currentHourIndex + 12)
          .map((time, i) => {
            const date = new Date(time);
            const hour = date.getHours();
            const temp = Math.round(
              json.hourly.temperature_2m[currentHourIndex + i]
            );
            const code = json.hourly.weathercode[currentHourIndex + i];
            const icon = ICON_MAP[code] || "cloudy";

            // === ПЕРША ГОДИНА = "Зараз" ===
            return {
              time: i === 0 ? "Зараз" : formatHour(hour),
              temp,
              icon,
              isNow: i === 0, // ← Тільки перша
              hour,
            };
          });

        setForecast(hours);
        setError(null);
      } catch (err) {
        console.error("Forecast error:", err);
        setError("Не вдалось завантажити прогноз");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
    const interval = setInterval(fetchForecast, 600000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  return { forecast, loading, error };
}

function formatHour(hour) {
  return `${hour}:00`;
}
