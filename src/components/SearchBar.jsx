import ArrowImg from "../images/icon-arrow.svg";
import { SearchSpinner } from "./Loading";

const SearchBar = ({
  onSearch,
  handleSubmit,
  isValid,
  errorMessage,
  handleChange,
  isLoading,
}) => {
  const message =
    isValid === false
      ? "Please enter a valid IP address or domain name."
      : errorMessage;

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
      {message && (
        <p className="error-message" role="alert">
          <svg
            className="error-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M10 1.667a8.333 8.333 0 1 0 0 16.666 8.333 8.333 0 0 0 0-16.666Zm0 12.916a1.042 1.042 0 1 1 0-2.083 1.042 1.042 0 0 1 0 2.083Zm1.042-4.166a1.042 1.042 0 0 1-2.084 0V5.833a1.042 1.042 0 0 1 2.084 0v4.584Z" />
          </svg>
          <span>{message}</span>
        </p>
      )}
    </form>
  );
};

export default SearchBar;
