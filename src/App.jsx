import { useState, useEffect } from "react";
import imgMobile from "../src/images/pattern-bg-mobile.png";
import imgDesktop from "../src/images/pattern-bg-desktop.png";
import CoordsPanel from "./components/CoordsPanel";
import Loading from "./components/Loading";
import Map from "./components/Map";
import SearchBar from "./components/SearchBar";
import "./App.css";

const App = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isValid, setIsValid] = useState(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!searchInput) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setIsError(false);
      const url = `https://free.freeipapi.com/api/json/${searchInput}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          setIsError(true);
          setIsLoading(false);
          return;
        }
        const result = await response.json();
        console.log(result);
        setData(result);
      } catch (error) {
        setIsError(true);
        console.log(error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [searchInput]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <h2 style={{ textAlign: "center", margin: "5rem auto" }}>
        Something went wrong. Please try again later.
      </h2>
    );
  }

  const regex =
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (value.trim() === "") {
      setIsValid(null);
    } else {
      setIsValid(regex.test(value.trim()));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
      />

      <CoordsPanel data={data} />
      <Map data={data} />
    </main>
  );
};

export default App;
// https://geo.ipify.org/api/v2/country,city?apiKey=YOUR_API_KEY&ipAddress=8.8.8.8
// pls update the project