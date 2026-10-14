# IP Address Tracker

A small React + Vite app that looks up an IP address or domain name and shows its
location, timezone, and ISP on an interactive map, using Leaflet with OpenStreetMap
tiles.

Built with:

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) for the map
- [ipify Geolocation API](https://geo.ipify.org/) for IP geolocation data
- [Jest](https://jestjs.io/) + [Testing Library](https://testing-library.com/) for tests

## Running locally

Requires a free ipify API key (sign up at [geo.ipify.org](https://geo.ipify.org/)).

```bash
cp .env.example .env
# then edit .env and set VITE_IPIFY_API_KEY to your key
npm install
npm run dev
```

Then open the printed local URL and search for an IP address (e.g. `8.8.8.8`).

## Testing

Tests run with Jest in a jsdom environment and live in `src/tests/`.

```bash
npm test               # run the whole suite
npm run test:coverage  # run it with a coverage report (written to coverage/)
```

What is covered:

- **`validateQuery`** — IPv4 and domain validation, including rejected inputs such as
  out-of-range octets, URLs, paths and IPv6.
- **`SearchBar`** — typing, submitting by button and Enter, the validation message,
  and the disabled/spinner state while loading.
- **`CoordsPanel`** — the formatted result, missing location parts, and the skeleton
  placeholders while loading.
- **`Loading`** — the delayed loading hook (driven with fake timers), skeleton pieces
  and the screen-reader status region.
- **`Map`** — marker position and anchor, popup, tiles, view syncing and resize
  handling, zero latitude/longitude, and the tap-to-activate behavior on touch devices.
- **`App`** — the lookup on load, the request URL for IPs and domains, trimming,
  invalid input never reaching the API, API and network errors, and overlapping
  searches (an older request is aborted and can never overwrite a newer result).

Notes:

- The API is mocked with a fake `fetch`, so no API key or network is needed to run
  the tests.
- Leaflet and react-leaflet are mocked in the `Map` tests; they exercise the app's
  own logic rather than Leaflet itself.
- A 100% threshold for statements, branches, functions and lines is enforced by
  `npm run test:coverage`, so the command fails if coverage drops.

## Strong points

- **Clean component split** — `SearchBar`, `CoordsPanel`, `Map`, and `Loading` each
  have a single, obvious responsibility, which makes the app easy to read and extend.
- **Real client-side validation** — input is checked against an IPv4/domain regex
  before a request is ever fired, instead of trusting the API to reject bad input.
- **Sensible loading/error states** — the UI clearly distinguishes "nothing searched
  yet," "loading," and "the request failed," so users aren't left staring at a blank
  screen.
- **Auto-fetch on load** — the app looks up the visitor's own IP on first render,
  so the card is never shown empty, even before a search.

## Weak points / known limitations

- **IPv6 not supported** — the validation regex accepts dotted IPv4 addresses and
  domain names, but IPv6 addresses are rejected.
- **No debouncing/caching** — every valid submission hits the live API directly, with
  no caching of recent lookups. A new search cancels the one still in flight, but
  repeated submissions are not rate limited.
- **No end-to-end or visual tests** — unit and integration tests cover the logic, but
  the responsive layouts and the real Leaflet map are only checked manually in a browser.
