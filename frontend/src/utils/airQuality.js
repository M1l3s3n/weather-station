export const getAirQuality = (co2) => {
  if (!co2 || co2 < 400)
    return { color: "#78FF8A", label: "Відмінна", level: "good" };
  if (co2 < 600) return { color: "#D6F01F", label: "Добра", level: "moderate" };
  if (co2 < 1000)
    return { color: "#FFB84D", label: "Помірна", level: "unhealthy" };
  if (co2 < 2000) return { color: "#FF5C5C", label: "Погана", level: "bad" };
};
