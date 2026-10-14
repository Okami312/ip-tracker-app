import { test as base, expect } from "@playwright/test";

const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAD0lEQVR4nGO4gQMwDC0JAEx5ogE1oy9YAAAAAElFTkSuQmCC",
  "base64",
);

export const lookup = (overrides = {}) => ({
  ip: "192.212.174.101",
  isp: "SpaceX Starlink",
  location: {
    lat: 40.6501,
    lng: -73.9496,
    city: "Brooklyn",
    region: "NY",
    country: "US",
    postalCode: "10001",
    timezone: "-05:00",
  },
  ...overrides,
});

export const json = (body, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

export const test = base.extend({
  api: async ({ page }, provide) => {
    const requests = [];
    let handler = () => json(lookup());

    await page.route("https://*.tile.openstreetmap.org/**", (route) =>
      route.fulfill({ contentType: "image/png", body: TILE_PNG }),
    );
    await page.route("https://geo.ipify.org/**", async (route) => {
      const url = new URL(route.request().url());
      requests.push(url);
      await route.fulfill(await handler(url));
    });

    await provide({
      requests,
      respondWith: (next) => {
        handler = next;
      },
    });
  },
});

export const open = async (page) => {
  await page.goto("/");
  await expect(page.locator("article")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

export const searchInput = (page) =>
  page.getByPlaceholder("Search for any IP address or domain");

export const submit = async (page, value) => {
  await searchInput(page).fill(value);
  await searchInput(page).press("Enter");
};

export const box = async (locator) => {
  const result = await locator.boundingBox();
  expect(result, "element has a bounding box").not.toBeNull();
  return result;
};

export const near = (actual, expected, tolerance = 1) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);

export { expect };
