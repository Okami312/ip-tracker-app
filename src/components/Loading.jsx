import { useEffect, useState } from "react";
import "./Loading.css";

export const useDelayedLoading = (isLoading, delay = 200) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setShow(true), delay);
    return () => {
      clearTimeout(timer);
      setShow(false);
    };
  }, [isLoading, delay]);

  return show;
};

export const SkeletonLine = () => (
  <span className="skeleton-line" aria-hidden="true" />
);

export const MapSkeleton = () => (
  <div className="leaflet-container map-skeleton" aria-hidden="true" />
);

export const SearchSpinner = () => (
  <span className="search-spinner" aria-hidden="true" />
);

export const LoadingStatus = ({ isLoading }) => (
  <p className="sr-only" role="status">
    {isLoading ? "Loading location data" : ""}
  </p>
);
