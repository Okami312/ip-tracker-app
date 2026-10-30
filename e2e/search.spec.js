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

test("searches by IPv6 address", async ({ page, api }) => {
  await open(page);
  api.respondWith(() =>
    json(lookup({ ip: "2606:4700:4700::1111", isp: "Cloudflare" })),
  );

  await submit(page, "2606:4700:4700::1111");

  await expect(page.locator("article")).toContainText("Cloudflare");
  expect(api.requests.at(-1).searchParams.get("ipAddress")).toBe(
    "2606:4700:4700::1111",
  );
  expect(api.requests.at(-1).searchParams.has("domain")).toBe(false);
});

test("canonicalizes a bracketed, zero-padded IPv6 address", async ({
  page,
  api,
}) => {
  await open(page);
  api.respondWith(() => json(lookup({ ip: "2001:db8::1" })));

  await submit(page, "[2001:0DB8:0000:0000:0000:0000:0000:0001]");

  await expect.poll(() => api.requests.length).toBe(2);
  expect(api.requests.at(-1).searchParams.get("ipAddress")).toBe("2001:db8::1");
});

test("another spelling of the same IPv6 address hits the cache", async ({
  page,
  api,
}) => {
  await open(page);
  api.respondWith(() => json(lookup({ ip: "2001:db8::1" })));
  await submit(page, "2001:db8::1");
  await expect(page.locator("article")).toContainText("2001:db8::1");
  const before = api.requests.length;

  await submit(page, "2001:0db8:0000:0000:0000:0000:0000:0001");

  await expect(page.locator("article")).toContainText("2001:db8::1");
  expect(api.requests).toHaveLength(before);
});

test("rejects an IPv6 address with a zone id", async ({ page, api }) => {
  await open(page);

  await submit(page, "fe80::1%eth0");

  await expect(page.getByRole("alert")).toHaveText(
    "Please enter a valid IP address or domain name.",
  );
  expect(api.requests).toHaveLength(1);
});

test("a full-length IPv6 address wraps instead of crowding the card", async ({
  page,
  api,
}) => {
  await open(page);
  // the widest value the field can hold: eight four-digit groups
  api.respondWith(() =>
    json(lookup({ ip: "2001:0db8:85a3:1319:8a2e:0370:7344:ffff" })),
  );

  await submit(page, "2001:db8:85a3:1319:8a2e:370:7344:ffff");

  const card = page.locator("article");
  await expect(card).toContainText("2001:0db8:85a3:1319:8a2e:0370:7344:ffff");

  const layout = await page.evaluate(() => {
    const article = document.querySelector("article");
    const value = article.querySelector("h5");
    const range = document.createRange();
    range.selectNodeContents(value);

    return {
      pageOverflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      cardOverflow: article.scrollWidth - article.clientWidth,
      valueOverflow: [...article.querySelectorAll("h5")].map(
        (h5) => h5.scrollWidth - h5.clientWidth,
      ),
      // one client rect per line box the address is laid out on
      lines: range.getClientRects().length,
      blockWidths: [...article.children].map(
        (block) => block.getBoundingClientRect().width,
      ),
    };
  });

  expect(layout.pageOverflow).toBeLessThanOrEqual(0);
  expect(layout.cardOverflow).toBeLessThanOrEqual(0);
  layout.valueOverflow.forEach((value) => expect(value).toBeLessThanOrEqual(0));
  // No column is wide enough for all 39 characters, so the address has to wrap.
  // Keeping it on one line would instead stretch the IP block and squeeze the
  // location and ISP next to it down to a few characters each.
  expect(layout.lines).toBeGreaterThan(1);
  const widest = Math.max(...layout.blockWidths);
  const narrowest = Math.min(...layout.blockWidths);
  expect(widest / narrowest).toBeLessThan(2.5);
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
