# IP Address Tracker

A small React + Vite app that looks up an IP address and shows its location, timezone,
and ISP on an interactive map. Search for any IPv4 address, and the app plots it using
Leaflet with OpenStreetMap tiles.

Built with:

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) for the map
- [freeipapi.com](https://freeipapi.com/) for IP geolocation data

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL and search for an IP address (e.g. `8.8.8.8`).

## Strong points

- **Clean component split** — `SearchBar`, `CoordsPanel`, `Map`, and `Loading` each
  have a single, obvious responsibility, which makes the app easy to read and extend.
- **Real client-side validation** — input is checked against a proper IPv4 regex
  before a request is ever fired, instead of trusting the API to reject bad input.
- **Sensible loading/error states** — the UI clearly distinguishes "nothing searched
  yet," "loading," and "the request failed," so users aren't left staring at a blank
  screen.
- **No API key required** — freeipapi.com's free tier means the app works out of the
  box with zero setup or secrets to manage.

## Weak points / known limitations

- **IPv4 only** — the validation regex and the search placeholder both suggest domain
  lookups are supported, but only dotted IPv4 addresses currently validate. Domain
  names and IPv6 addresses are rejected.
- **No debouncing/caching** — every valid submission hits the live API directly, with
  no caching of recent lookups or protection against rapid repeated submissions.
- **Minimal error detail** — network and API failures all collapse into one generic
  "Something went wrong" message, so there's no way to tell a bad IP apart from a
  network outage or rate limiting.
- **No tests** — there's currently no automated test coverage (unit or end-to-end),
  so regressions rely on manual verification.
- **Dependency drift** — `package.json` pins `eslint@^10`, which conflicts with
  `eslint-plugin-react-hooks`'s peer range; installing currently requires
  `npm install --legacy-peer-deps` until the versions are reconciled.
