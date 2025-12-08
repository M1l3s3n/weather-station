import L from "leaflet";

export const createColoredIcon = (color) => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 2.5vh;
        height: 2.5vh;
        border-radius: 50%;
        border: 1px solid gray;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      "></div>
    `,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};
