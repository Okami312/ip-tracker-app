import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

jest.mock("../components/Map", () => ({
  __esModule: true,
  default: ({ data }) =>
    data ? (
      <div data-testid="map">{`${data.latitude},${data.longitude}`}</div>
    ) : null,
}));

const apiResult = (overrides = {}) => ({
  ip: "1.1.1.1",
  isp: "Cloudflare",
  location: {
    lat: 10,
    lng: 20,
    city: "Sydney",
    region: "NSW",
    country: "AU",
    postalCode: "2000",
    timezone: "+10:00",
  },
  ...overrides,
});

const respond = (body, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

const search = async (value) => {
  const input = screen.getByPlaceholderText(
    "Search for any IP address or domain",
  );
  await userEvent.clear(input);
  await userEvent.type(input, `${value}{Enter}`);
};

beforeAll(() => {
  process.env.VITE_IPIFY_API_KEY = "test-key";
});

beforeEach(() => {
  global.fetch = jest.fn(() => respond(apiResult()));
});

describe("App", () => {
  it("looks up the visitor's own IP on load", async () => {
    render(<App />);

    expect(await screen.findByText("1.1.1.1")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe(
      "https://geo.ipify.org/api/v2/country,city?apiKey=test-key",
    );
    expect(screen.getByText("Sydney, NSW, AU 2000")).toBeInTheDocument();
    expect(screen.getByText("UTC +10:00")).toBeInTheDocument();
    expect(screen.getByText("Cloudflare")).toBeInTheDocument();
    expect(screen.getByTestId("map")).toHaveTextContent("10,20");
  });

  it("searches by ipAddress for an IPv4 query", async () => {
    render(<App />);
    await screen.findByText("1.1.1.1");
    fetch.mockImplementationOnce(() => respond(apiResult({ ip: "8.8.8.8" })));

    await search("8.8.8.8");

    expect(await screen.findByText("8.8.8.8")).toBeInTheDocument();
    expect(fetch.mock.calls[1][0]).toContain("&ipAddress=8.8.8.8");
  });

  it("searches by domain for a hostname query", async () => {
    render(<App />);
    await screen.findByText("1.1.1.1");

    await search("example.com");

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls[1][0]).toContain("&domain=example.com");
  });

  it("trims the query before searching", async () => {
    render(<App />);
    await screen.findByText("1.1.1.1");

    await search("  8.8.4.4  ");

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls[1][0]).toContain("&ipAddress=8.8.4.4");
  });

  it("rejects an invalid query without calling the API", async () => {
    render(<App />);
    await screen.findByText("1.1.1.1");

    await search("not a query");

    expect(
      screen.getByText("Please enter a valid IP address or domain name."),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("ignores an empty submit", async () => {
    render(<App />);
    await screen.findByText("1.1.1.1");

    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shows the API's error message", async () => {
    fetch.mockImplementationOnce(() =>
      respond({ messages: "Access restricted. Check your API key." }, false),
    );

    render(<App />);

    expect(
      await screen.findByText("Access restricted. Check your API key."),
    ).toBeInTheDocument();
  });

  it("falls back to a generic message when the API gives none", async () => {
    fetch.mockImplementationOnce(() => respond({}, false));

    render(<App />);

    expect(
      await screen.findByText("Something went wrong. Please try again later."),
    ).toBeInTheDocument();
  });

  it("shows a network error when the request fails", async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new TypeError("fail")));

    render(<App />);

    expect(
      await screen.findByText(
        "Network error. Please check your connection and try again.",
      ),
    ).toBeInTheDocument();
  });

  describe("overlapping searches", () => {
    const abortable = () => {
      const calls = [];
      global.fetch = jest.fn(
        (url, { signal }) =>
          new Promise((resolve, reject) => {
            calls.push({
              url,
              signal,
              resolve: (body) => resolve({ ok: true, json: async () => body }),
            });
            signal.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      );
      return calls;
    };

    it("aborts the previous request when a new search starts", async () => {
      const calls = abortable();
      render(<App />);
      await waitFor(() => expect(calls).toHaveLength(1));
      calls[0].resolve(apiResult());
      await screen.findByText("1.1.1.1");

      await search("8.8.8.8");
      await waitFor(() => expect(calls).toHaveLength(2));
      await search("9.9.9.9");
      await waitFor(() => expect(calls).toHaveLength(3));

      expect(calls[1].signal.aborted).toBe(true);
      expect(calls[2].signal.aborted).toBe(false);
    });

    it("keeps the latest result even if an older request answers later", async () => {
      const calls = abortable();
      render(<App />);
      await waitFor(() => expect(calls).toHaveLength(1));
      calls[0].resolve(apiResult());
      await screen.findByText("1.1.1.1");

      await search("8.8.8.8");
      await waitFor(() => expect(calls).toHaveLength(2));
      await search("9.9.9.9");
      await waitFor(() => expect(calls).toHaveLength(3));

      calls[2].resolve(apiResult({ ip: "9.9.9.9" }));
      calls[1].resolve(apiResult({ ip: "8.8.8.8" }));

      expect(await screen.findByText("9.9.9.9")).toBeInTheDocument();
      expect(screen.queryByText("8.8.8.8")).not.toBeInTheDocument();
    });

    it("does not show an error for an aborted request", async () => {
      const calls = abortable();
      const { unmount } = render(<App />);
      await waitFor(() => expect(calls).toHaveLength(1));

      unmount();

      expect(calls[0].signal.aborted).toBe(true);
    });
  });
});
