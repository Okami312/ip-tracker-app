import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import marker from "../images/icon-location.svg";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { MapSkeleton } from "./Loading";

const MapView = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(coords, 13);
    const handleResize = () => map.invalidateSize();
    const timer = setTimeout(handleResize, 0);
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [coords, map]);
  return null;
};

const TapToActivate = () => {
  const map = useMap();

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const container = map.getContainer();
    const handlers = [map.dragging, map.touchZoom, map.doubleClickZoom];
    const setActive = (active) => {
      handlers.forEach((handler) =>
        active ? handler.enable() : handler.disable(),
      );
      container.classList.toggle("map-inactive", !active);
    };
    const activate = () => setActive(true);
    const deactivate = (e) => {
      if (!container.contains(e.target)) setActive(false);
    };

    setActive(false);
    container.addEventListener("click", activate);
    document.addEventListener("pointerdown", deactivate);
    return () => {
      container.removeEventListener("click", activate);
      document.removeEventListener("pointerdown", deactivate);
    };
  }, [map]);

  return null;
};

const Map = ({ data, isLoading }) => {
  const lat = data?.latitude;
  const lng = data?.longitude;
  const skeleton = isLoading && <MapSkeleton />;
  if (lat == null || lng == null) return skeleton || null;

  const position = [lat, lng];

  const customIcon = L.divIcon({
    className: "leaflet-icon",
    html: `<div class="icon-wrapper"><img src="${marker}" alt="Marker" /></div>`,
    iconSize: [46, 56],
    iconAnchor: [23, 56],
    popupAnchor: [0, -66],
  });

  return (
    <>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        className="leaflet-container"
      >
        <MapView coords={position} />
        <TapToActivate />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customIcon}>
          <Popup>{`IP: ${data?.ipAddress}`}</Popup>
        </Marker>
      </MapContainer>
      {skeleton}
    </>
  );
};

export default Map;
