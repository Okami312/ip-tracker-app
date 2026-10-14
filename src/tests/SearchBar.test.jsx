import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "../components/SearchBar";

const setup = (props = {}) => {
  const handlers = {
    handleSubmit: jest.fn((e) => e.preventDefault()),
    handleChange: jest.fn(),
  };
  render(
    <SearchBar
      onSearch=""
      isValid={null}
      isLoading={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

describe("SearchBar", () => {
  it("shows the placeholder and the current value", () => {
    setup({ onSearch: "8.8.8.8" });

    expect(
      screen.getByPlaceholderText("Search for any IP address or domain"),
    ).toHaveValue("8.8.8.8");
  });

  it("reports typing through handleChange", async () => {
    const { handleChange } = setup();

    await userEvent.type(screen.getByRole("textbox"), "1");

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("submits with the button and with Enter", async () => {
    const { handleSubmit } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    await userEvent.type(screen.getByRole("textbox"), "{Enter}");

    expect(handleSubmit).toHaveBeenCalledTimes(2);
  });

  it("shows no message while the input has not been validated", () => {
    setup({ isValid: null });

    expect(screen.queryByText(/valid IP address/)).not.toBeInTheDocument();
  });

  it("shows no message for a valid query", () => {
    setup({ isValid: true });

    expect(screen.queryByText(/valid IP address/)).not.toBeInTheDocument();
  });

  it("shows the validation message for an invalid query", () => {
    setup({ isValid: false });

    expect(
      screen.getByText("Please enter a valid IP address or domain name."),
    ).toBeInTheDocument();
  });

  it("shows a request error message as an alert", () => {
    setup({ errorMessage: "Network error." });

    expect(screen.getByRole("alert")).toHaveTextContent("Network error.");
  });

  it("prefers the validation message over an older request error", () => {
    setup({ isValid: false, errorMessage: "Network error." });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter a valid IP address or domain name.",
    );
    expect(screen.queryByText("Network error.")).not.toBeInTheDocument();
  });

  it("shows no alert without a validation or request error", () => {
    setup({ isValid: true, errorMessage: null });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables the button and swaps the arrow for a spinner while loading", async () => {
    const { handleSubmit } = setup({ isLoading: true });
    const button = screen.getByRole("button", { name: "Search" });

    expect(button).toBeDisabled();
    expect(button.querySelector(".search-spinner")).toBeInTheDocument();
    expect(button.querySelector("img")).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
