import { box, expect, near, open, searchInput, test } from "./fixtures";

const figma = {
  mobile: {
    banner: 300,
    searchWidth: 327,
    searchTop: 87,
    cardWidth: 327,
    cardTop: 169,
    mapTop: 300,
  },
  tablet: {
    banner: 280,
    searchWidth: 555,
    searchTop: 93,
    cardWidth: 555,
    cardTop: 175,
    mapTop: 280,
  },
  desktop: {
    banner: 280,
    searchWidth: 555,
    searchTop: 93,
    cardWidth: 1111,
    cardTop: 199,
    mapTop: 280,
  },
};

test.describe("layout matches the Figma frames", () => {
  test.beforeEach(async ({ page, api }) => {
    void api;
    await open(page);
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("banner height", async ({ page }, testInfo) => {
    const expected = figma[testInfo.project.name];
    const banner = await box(page.locator(".background-pattern"));

    near(banner.y, 0);
    near(banner.height, expected.banner);
  });

  test("search bar size and position", async ({ page }, testInfo) => {
    const expected = figma[testInfo.project.name];
    const form = await box(page.locator("form.input-search"));
    const viewport = page.viewportSize().width;

    near(form.width, expected.searchWidth);
    near(form.height, 58);
    near(form.y, expected.searchTop);
    near(form.x + form.width / 2, viewport / 2);
  });

  test("info card size and position", async ({ page }, testInfo) => {
    const expected = figma[testInfo.project.name];
    const card = await box(page.locator("article"));
    const viewport = page.viewportSize().width;

    near(card.width, expected.cardWidth);
    near(card.y, expected.cardTop);
    near(card.x + card.width / 2, viewport / 2);
  });

  test("map starts at the bottom of the banner and fills the width", async ({
    page,
  }, testInfo) => {
    const expected = figma[testInfo.project.name];
    const map = await box(page.locator(".leaflet-container"));
    const viewport = page.viewportSize();

    near(map.y, expected.mapTop);
    near(map.x, 0);
    near(map.width, viewport.width);
    expect(map.y + map.height).toBeGreaterThanOrEqual(viewport.height - 1);
  });

  test("card overlaps the banner and the map", async ({ page }) => {
    const banner = await box(page.locator(".background-pattern"));
    const card = await box(page.locator("article"));
    const map = await box(page.locator(".leaflet-container"));

    expect(card.y).toBeLessThan(banner.y + banner.height);
    expect(card.y + card.height).toBeGreaterThan(map.y);
  });

  test("search bar sits above the card without overlapping it", async ({
    page,
  }) => {
    const form = await box(page.locator("form.input-search"));
    const card = await box(page.locator("article"));

    expect(form.y + form.height).toBeLessThanOrEqual(card.y);
  });

  test("page has no horizontal scrolling", async ({ page }) => {
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("shows the four info blocks with the lookup data", async ({ page }) => {
    const card = page.locator("article");

    await expect(card).toContainText("192.212.174.101");
    await expect(card).toContainText("Brooklyn, NY, US 10001");
    await expect(card).toContainText("UTC -05:00");
    await expect(card).toContainText("SpaceX Starlink");
    await expect(searchInput(page)).toBeVisible();
  });
});
