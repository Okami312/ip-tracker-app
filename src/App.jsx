import { useState, useEffect } from "react";
import imgMobile from "./images/pattern-bg-mobile.png";
import imgDesktop from "./images/pattern-bg-desktop.png";
import CoordsPanel from "./components/CoordsPanel";
import Map from "./components/Map";
import SearchBar from "./components/SearchBar";
import { LoadingStatus, useDelayedLoading } from "./components/Loading";
import "./App.css";

const ipv4Regex =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const domainRegex =
  /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const isValidQuery = (value) =>
  ipv4Regex.test(value) || domainRegex.test(value);

const App = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isValid, setIsValid] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const showLoading = useDelayedLoading(isLoading);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      const apiKey = import.meta.env.VITE_IPIFY_API_KEY;
      const param = submittedQuery
        ? `&${ipv4Regex.test(submittedQuery) ? "ipAddress" : "domain"}=${submittedQuery}`
        : "";
      const url = `https://geo.ipify.org/api/v2/country,city?apiKey=${apiKey}${param}`;
      try {
        const response = await fetch(url, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) {
          setErrorMessage(
            result.messages || "Something went wrong. Please try again later.",
          );
          setIsLoading(false);
          return;
        }
        setData({
          ipAddress: result.ip,
          latitude: result.location?.lat,
          longitude: result.location?.lng,
          cityName: result.location?.city,
          regionName: result.location?.region,
          countryName: result.location?.country,
          postalCode: result.location?.postalCode,
          timezone: result.location?.timezone,
          asnOrganization: result.isp,
        });
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
  }, [submittedQuery]);

  if (errorMessage) {
    return (
      <h2 style={{ textAlign: "center", margin: "5rem auto" }}>
        {errorMessage}
      </h2>
    );
  }

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
    setSubmittedQuery(trimmed);
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
        isLoading={showLoading}
      />

      <CoordsPanel data={data} isLoading={showLoading} />
      <Map data={data} isLoading={showLoading} />
      <LoadingStatus isLoading={showLoading} />
    </main>
  );
};

export default App;
