import "./WeatherPreloader.css";

export default function WeatherPreloader({ isLoading }) {
  return (
    <div className={`preloader ${!isLoading ? "hidden" : ""}`}>
      <div className="sun-loader"></div>
      <div className="preloader-text">Завантаження метеостанції...</div>
    </div>
  );
}
