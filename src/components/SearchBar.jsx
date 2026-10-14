import ArrowImg from "../images/icon-arrow.svg";
import { SearchSpinner } from "./Loading";

const SearchBar = ({
  onSearch,
  handleSubmit,
  isValid,
  handleChange,
  isLoading,
}) => {
  return (
    <form className="input-search" onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={handleChange}
        value={onSearch}
        placeholder="Search for any IP address or domain"
      />
      <button
        className="search-btn"
        type="submit"
        disabled={isLoading}
        aria-label="Search"
      >
        {isLoading ? (
          <SearchSpinner />
        ) : (
          <img src={ArrowImg} alt="" className="search-arrow" />
        )}
      </button>
      {isValid !== null && (
        <p className="error-message">
          {isValid ? "" : "Please enter a valid IP address or domain name."}
        </p>
      )}
    </form>
  );
};

export default SearchBar;
