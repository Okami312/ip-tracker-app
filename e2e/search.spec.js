import {
  expect,
  json,
  lookup,
  open,
  searchInput,
  submit,
  test,
} from "./fixtures";

test("looks up the visitor's own IP on load", async ({ page, api }) => {
  await open(page);

  expect(api.requests).toHaveLength(1);
  expect(api.requests[0].searchParams.has("ipAddress")).toBe(false);
  expect(api.requests[0].searchParams.has("domain")).toBe(false);
  await expect(page.locator("article")).toContainText("192.212.174.101");
});

test("searches by IP address", async ({ page, api }) => {
  await open(page);
  api.respondWith(() => json(lookup({ ip: "8.8.8.8", isp: "Google LLC" })));

  await submit(page, "8.8.8.8");

  await expect(page.locator("article")).toContainText("Google LLC");
  expect(api.requests.at(-1).searchParams.get("ipAddress")).toBe("8.8.8.8");
});

test("searches by domain", async ({ page, api }) => {
  await open(page);

  await submit(page, "example.com");

  await expect.poll(() => api.requests.length).toBe(2);
  expect(api.requests.at(-1).searchParams.get("domain")).toBe("example.com");
});

test("rejects invalid input without calling the API", async ({ page, api }) => {
  await open(page);

  await submit(page, "not a valid query");

  await expect(page.getByRole("alert")).toHaveText(
    "Please enter a valid IP address or domain name.",
  );
  expect(api.requests).toHaveLength(1);
});

test("shows API errors inline and keeps the last result", async ({
  page,
  api,
}) => {
  await open(page);
  api.respondWith(() => json({ messages: "Too many requests." }, 429));

  await submit(page, "8.8.8.8");

  await expect(page.getByRole("alert")).toHaveText("Too many requests.");
  await expect(searchInput(page)).toBeVisible();
  await expect(page.locator("article")).toContainText("192.212.174.101");
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("shows a network error inline", async ({ page, api }) => {
  await open(page);
  await page.route("https://geo.ipify.org/**", (route) => route.abort());

  await submit(page, "8.8.8.8");

  await expect(page.getByRole("alert")).toContainText("Network error");
  void api;
});

test("shows skeletons and a spinner while a slow lookup runs", async ({
  page,
  api,
}) => {
  await open(page);
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  api.respondWith(async () => {
    await gate;
    return json(lookup({ ip: "9.9.9.9" }));
  });

  await submit(page, "9.9.9.9");

  await expect(page.locator(".skeleton-line")).toHaveCount(4);
  await expect(page.locator(".search-spinner")).toBeVisible();
  await expect(page.locator(".map-skeleton")).toBeVisible();
  await expect(page.getByRole("button", { name: "Search" })).toBeDisabled();

  release();

  await expect(page.locator("article")).toContainText("9.9.9.9");
  await expect(page.locator(".skeleton-line")).toHaveCount(0);
  await expect(page.locator(".map-skeleton")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Search" })).toBeEnabled();
});

test("a repeated search comes from the cache", async ({ page, api }) => {
  await open(page);
  api.respondWith(() => json(lookup({ ip: "8.8.8.8" })));
  await submit(page, "8.8.8.8");
  await expect(page.locator("article")).toContainText("8.8.8.8");
  const before = api.requests.length;

  await submit(page, "8.8.8.8");

  await expect(page.locator("article")).toContainText("8.8.8.8");
  expect(api.requests).toHaveLength(before);
});
