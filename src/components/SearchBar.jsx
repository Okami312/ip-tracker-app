import ArrowImg from "../images/icon-arrow.svg";

const SearchBar = ({ onSearch, handleSubmit, isValid, handleChange }) => {
  return (
    <form className="input-search" onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={handleChange}
        value={onSearch}
        placeholder="Search for any IP address or domain"
      />
      <button className="search-btn" type="submit">
        <img src={ArrowImg} alt="search" className="search-arrow" />
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