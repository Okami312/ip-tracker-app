import { useState, useEffect, useRef } from "react";
import imgMobile from "./images/pattern-bg-mobile.png";
import imgDesktop from "./images/pattern-bg-desktop.png";
import CoordsPanel from "./components/CoordsPanel";
import Map from "./components/Map";
import SearchBar from "./components/SearchBar";
import { LoadingStatus, useDelayedLoading } from "./components/Loading";
import { ipv4Regex, isValidQuery } from "./utils/validateQuery";
import { createLookupCache } from "./utils/lookupCache";
import {
  CACHE_MAX_ENTRIES,
  CACHE_TTL_MS,
  MIN_REQUEST_INTERVAL_MS,
} from "./utils/lookupLimits";
import { wait } from "./utils/wait";
import "./App.css";

const App = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [request, setRequest] = useState({ query: "", id: 0 });
  const [isValid, setIsValid] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const showLoading = useDelayedLoading(isLoading);
  const [cache] = useState(() =>
    createLookupCache({ ttl: CACHE_TTL_MS, max: CACHE_MAX_ENTRIES }),
  );
  const lastRequest = useRef({ query: null, at: 0 });

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      const { query } = request;
      const cached = cache.get(query);
      if (cached) {
        setErrorMessage(null);
        setData(cached);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      const apiKey = import.meta.env.VITE_IPIFY_API_KEY;
      const param = query
        ? `&${ipv4Regex.test(query) ? "ipAddress" : "domain"}=${query}`
        : "";
      const url = `https://geo.ipify.org/api/v2/country,city?apiKey=${apiKey}${param}`;
      try {
        const previous = lastRequest.current;
        if (previous.query !== query) {
          await wait(
            MIN_REQUEST_INTERVAL_MS - (Date.now() - previous.at),
            controller.signal,
          );
        }
        lastRequest.current = { query, at: Date.now() };

        const response = await fetch(url, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) {
          setErrorMessage(
            result.messages || "Something went wrong. Please try again later.",
          );
          setIsLoading(false);
          return;
        }
        const lookup = {
          ipAddress: result.ip,
          latitude: result.location?.lat,
          longitude: result.location?.lng,
          cityName: result.location?.city,
          regionName: result.location?.region,
          countryName: result.location?.country,
          postalCode: result.location?.postalCode,
          timezone: result.location?.timezone,
          asnOrganization: result.isp,
        };
        cache.set(query, lookup);
        setData(lookup);
      } catch (error) {
        if (error.name === "AbortError") return;
        setErrorMessage(
          "Network error. Please check your connection and try again.",
        );
      }
      setIsLoading(false);
    };

    fetchData();
    return () => controller.abort();
  }, [request, cache]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (value.trim() === "") {
      setIsValid(null);
    } else {
      setIsValid(isValidQuery(value.trim()));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed || !isValidQuery(trimmed)) {
      setIsValid(false);
      return;
    }
    if (isLoading && trimmed === request.query) return;
    setRequest(({ id }) => ({ query: trimmed, id: id + 1 }));
  };

  return (
    <main>
      <h1 className="title">IP Address Tracker</h1>
      <div className="background-pattern">
        <img
          src={imgMobile}
          alt="Background pattern"
          className="mobile-background"
        />
        <img
          src={imgDesktop}
          alt="Background pattern"
          className="desktop-background"
        />
      </div>

      <SearchBar
        onSearch={searchInput}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        isValid={isValid}
        errorMessage={errorMessage}
        isLoading={showLoading}
      />

      <CoordsPanel data={data} isLoading={showLoading} />
      <Map data={data} isLoading={showLoading} />
      <LoadingStatus isLoading={showLoading} />
    </main>
  );
};

export default App;
