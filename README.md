# IP Address Tracker

A small React + Vite app that looks up an IP address or domain name and shows its
location, timezone, and ISP on an interactive map, using Leaflet with OpenStreetMap
tiles.

Built with:

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) for the map
- [ipify Geolocation API](https://geo.ipify.org/) for IP geolocation data

## Running locally

Requires a free ipify API key (sign up at [geo.ipify.org](https://geo.ipify.org/)).

```bash
cp .env.example .env
# then edit .env and set VITE_IPIFY_API_KEY to your key
npm install
npm run dev
```

Then open the printed local URL and search for an IP address (e.g. `8.8.8.8`).

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
  no caching of recent lookups or protection against rapid repeated submissions.
- **No tests** — there's currently no automated test coverage (unit or end-to-end),
  so regressions rely on manual verification.
