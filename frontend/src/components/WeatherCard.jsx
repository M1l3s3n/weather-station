import "./cardsStyles.css";

export default function WeatherCard({ data, loading }) {
  if (loading) {
    return <div className="weather-card">Завантаження...</div>;
  }

  if (!data) {
    return <div className="weather-card">Немає даних</div>;
  }

  const { temperature, humidity } = data;

  return (
    <div className="weather-card">
      <div className="temperature-main">{temperature}°C</div>
      <div className="humidity">Вологість {humidity}%</div>
    </div>
  );
}
