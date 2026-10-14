import { StrictMode } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

jest.mock("../components/Map", () => ({
  __esModule: true,
  default: () => null,
}));

const apiResult = (ip) => ({
  ip,
  isp: "ISP",
  location: { lat: 1, lng: 2, city: "City", timezone: "+00:00" },
});

const flush = () => act(() => jest.advanceTimersByTimeAsync(0));
const advance = (ms) => act(() => jest.advanceTimersByTimeAsync(ms));

const urls = () => fetch.mock.calls.map(([url]) => url);

let user;

const search = async (value) => {
  const input = screen.getByPlaceholderText(
    "Search for any IP address or domain",
  );
  await user.clear(input);
  await user.type(input, `${value}{Enter}`);
};

beforeAll(() => {
  process.env.VITE_IPIFY_API_KEY = "test-key";
});

beforeEach(() => {
  jest.useFakeTimers();
  user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  global.fetch = jest.fn((url, { signal }) =>
    signal.aborted
      ? Promise.reject(new DOMException("Aborted", "AbortError"))
      : Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(apiResult(url.split("ipAddress=")[1] ?? "1.1.1.1")),
        }),
  );
});

afterEach(() => jest.useRealTimers());

describe("request pacing", () => {
  it("sends the first lookup immediately", async () => {
    render(<App />);
    await flush();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not wait on the first load under StrictMode", async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await flush();

    expect(fetch).toHaveBeenCalled();
    expect(await screen.findByText("1.1.1.1")).toBeInTheDocument();
  });

  it("holds a different search back until the minimum interval passed", async () => {
    render(<App />);
    await flush();

    await search("8.8.8.8");
    await advance(500);
    expect(fetch).toHaveBeenCalledTimes(1);

    await advance(499);
    expect(fetch).toHaveBeenCalledTimes(1);

    await advance(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(urls()[1]).toContain("ipAddress=8.8.8.8");
  });

  it("collapses a burst of searches into the last one", async () => {
    render(<App />);
    await flush();

    await search("8.8.8.8");
    await search("9.9.9.9");
    await search("4.4.4.4");
    await advance(1000);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(urls()[1]).toContain("ipAddress=4.4.4.4");
    expect(urls().join()).not.toContain("8.8.8.8");
    expect(urls().join()).not.toContain("9.9.9.9");
  });

  it("sends a new search immediately once the interval has passed", async () => {
    render(<App />);
    await flush();
    await advance(1000);

    await search("8.8.8.8");
    await flush();

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
