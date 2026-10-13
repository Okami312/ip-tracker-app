import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import marker from "../images/icon-location.svg";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

const MapView = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (coords[0] && coords[1]) {
      map.setView(coords, 13);
      const handleResize = () => map.invalidateSize();
      const timer = setTimeout(handleResize, 0);
      window.addEventListener("resize", handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [coords, map]);
  return null;
};

const Map = ({ data }) => {
  const lat = data?.latitude;
  const lng = data?.longitude;
  if (!lat || !lng) return null;

  const position = [lat, lng];

  const customIcon = L.divIcon({
    className: "leaflet-icon",
    html: `<div class="icon-wrapper"><img src="${marker}" alt="Marker" /></div>`,
    iconSize: [32, 45],
    iconAnchor: [16, 45],
    popupAnchor: [-0, -76],
  });

  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={false}
      className="leaflet-container"
    >
      <MapView coords={position} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={customIcon}>
        <Popup>{`IP: ${data?.ipAddress}`}</Popup>
      </Marker>
    </MapContainer>
  );
};

export default Map;
