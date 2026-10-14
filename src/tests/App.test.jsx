import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

jest.mock("../utils/lookupLimits", () => ({
  CACHE_TTL_MS: 300000,
  CACHE_MAX_ENTRIES: 20,
  MIN_REQUEST_INTERVAL_MS: 0,
}));

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

  it("keeps the page and the last result visible when a search fails", async () => {
    render(<App />);
    await screen.findByText("1.1.1.1");
    fetch.mockImplementationOnce(() =>
      respond({ messages: "Too many requests." }, false),
    );

    await search("8.8.8.8");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many requests.",
    );
    expect(
      screen.getByPlaceholderText("Search for any IP address or domain"),
    ).toBeInTheDocument();
    expect(screen.getByText("1.1.1.1")).toBeInTheDocument();
    expect(screen.getByTestId("map")).toBeInTheDocument();
  });

  it("clears the error when the next search succeeds", async () => {
    render(<App />);
    await screen.findByText("1.1.1.1");
    fetch.mockImplementationOnce(() =>
      respond({ messages: "Too many requests." }, false),
    );
    await search("8.8.8.8");
    await screen.findByRole("alert");
    fetch.mockImplementationOnce(() => respond(apiResult({ ip: "9.9.9.9" })));

    await search("9.9.9.9");

    expect(await screen.findByText("9.9.9.9")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the search bar with an empty card when the first lookup fails", async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new TypeError("fail")));

    render(<App />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search for any IP address or domain"),
    ).toBeInTheDocument();
    expect(screen.getByText("IP Address")).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
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

  describe("caching", () => {
    const lookup = (ip) => () => respond(apiResult({ ip }));

    it("serves a repeated search from the cache without a request", async () => {
      render(<App />);
      await screen.findByText("1.1.1.1");
      fetch
        .mockImplementationOnce(lookup("8.8.8.8"))
        .mockImplementationOnce(lookup("9.9.9.9"));

      await search("8.8.8.8");
      await screen.findByText("8.8.8.8");
      await search("9.9.9.9");
      await screen.findByText("9.9.9.9");
      expect(fetch).toHaveBeenCalledTimes(3);

      await search("8.8.8.8");

      expect(await screen.findByText("8.8.8.8")).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("treats a domain case-insensitively when caching", async () => {
      render(<App />);
      await screen.findByText("1.1.1.1");

      await search("Example.com");
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      await search("example.COM");
      await search("example.com");

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("does not cache a failed lookup, so the same search can retry", async () => {
      render(<App />);
      await screen.findByText("1.1.1.1");
      fetch.mockImplementationOnce(() =>
        respond({ messages: "Too many requests." }, false),
      );
      await search("8.8.8.8");
      await screen.findByRole("alert");
      fetch.mockImplementationOnce(lookup("8.8.8.8"));

      await search("8.8.8.8");

      expect(await screen.findByText("8.8.8.8")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("clears an old error when a cached result is shown", async () => {
      render(<App />);
      await screen.findByText("1.1.1.1");
      fetch.mockImplementationOnce(lookup("8.8.8.8"));
      await search("8.8.8.8");
      await screen.findByText("8.8.8.8");
      fetch.mockImplementationOnce(() => Promise.reject(new TypeError("x")));
      await search("9.9.9.9");
      await screen.findByRole("alert");

      await search("8.8.8.8");

      expect(await screen.findByText("8.8.8.8")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
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

    it("ignores a duplicate submit while that query is in flight", async () => {
      const calls = abortable();
      render(<App />);
      await waitFor(() => expect(calls).toHaveLength(1));
      calls[0].resolve(apiResult());
      await screen.findByText("1.1.1.1");

      await search("8.8.8.8");
      await waitFor(() => expect(calls).toHaveLength(2));
      await userEvent.type(
        screen.getByPlaceholderText("Search for any IP address or domain"),
        "{Enter}",
      );

      expect(calls).toHaveLength(2);
      expect(calls[1].signal.aborted).toBe(false);
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
