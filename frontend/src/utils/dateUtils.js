export const formatUkrainianDate = (dateString) => {
  if (!dateString) return "...";

  const date = new Date(dateString);

  const dayName = date
    .toLocaleDateString("uk-UA", { weekday: "long" })
    .toLowerCase();

  const dateNum = date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const correctDays = {
    понеділок: "понеділок",
    вівторок: "вівторок",
    середа: "середа",
    четвер: "четвер",
    "п'ятниця": "п'ятниця",
    субота: "субота",
    неділя: "неділя",
  };

  const finalDay = correctDays[dayName] || dayName;
  return `${finalDay}, ${dateNum}`;
};
