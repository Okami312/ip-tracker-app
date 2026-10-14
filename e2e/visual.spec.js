import { expect, json, lookup, open, submit, test } from "./fixtures";

const shot = (page, name) =>
  expect(page).toHaveScreenshot(name, { fullPage: true });

test("default result", async ({ page, api }) => {
  void api;
  await open(page);
  await expect(page.locator(".leaflet-marker-icon")).toBeVisible();

  await shot(page, "result.png");
});

test("long location and ISP", async ({ page, api }) => {
  api.respondWith(() =>
    json(
      lookup({
        isp: "Vodafone Romania Telecommunications S.A.",
        location: {
          lat: 44.4268,
          lng: 26.1025,
          city: "Indianapolis",
          region: "Indiana",
          country: "US",
          postalCode: "46201",
          timezone: "-04:00",
        },
      }),
    ),
  );
  await open(page);
  await expect(page.locator(".leaflet-marker-icon")).toBeVisible();

  await shot(page, "long-values.png");
});

test("loading skeleton", async ({ page, api }) => {
  await open(page);
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  api.respondWith(async () => {
    await gate;
    return json(lookup());
  });

  await submit(page, "9.9.9.9");
  await expect(page.locator(".skeleton-line")).toHaveCount(4);

  await shot(page, "loading.png");
  release();
});

test("inline error", async ({ page, api }) => {
  await open(page);
  api.respondWith(() => json({ messages: "Too many requests." }, 429));

  await submit(page, "8.8.8.8");
  await expect(page.getByRole("alert")).toBeVisible();

  await shot(page, "error.png");
});

test("invalid input message", async ({ page, api }) => {
  void api;
  await open(page);

  await submit(page, "not a valid query");
  await expect(page.getByRole("alert")).toBeVisible();

  await shot(page, "invalid.png");
});
