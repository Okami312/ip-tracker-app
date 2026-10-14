import { box, expect, near, open, test } from "./fixtures";

test.beforeEach(async ({ page, api }) => {
  void api;
  await open(page);
  await expect(page.locator(".leaflet-marker-icon")).toBeVisible();
});

test("pin tip sits exactly on the center of the map", async ({ page }) => {
  const map = await box(page.locator(".leaflet-container"));
  const pin = await box(page.locator(".leaflet-marker-icon img"));

  near(pin.x + pin.width / 2, map.x + map.width / 2, 1.5);
  near(pin.y + pin.height, map.y + map.height / 2, 1.5);
  near(pin.width, 46, 1);
  near(pin.height, 56, 1);
});

test("tapping the pin opens the IP popup", async ({ page }, testInfo) => {
  const pin = page.locator(".leaflet-marker-icon");
  if (testInfo.project.use.hasTouch) {
    await pin.tap();
  } else {
    await pin.click();
  }

  await expect(page.locator(".leaflet-popup-content")).toHaveText(
    "IP: 192.212.174.101",
  );
});

test("zoom buttons only show for a mouse pointer", async ({
  page,
}, testInfo) => {
  const zoom = page.locator(".leaflet-control-zoom");

  if (testInfo.project.use.hasTouch) {
    await expect(zoom).toBeHidden();
  } else {
    await expect(zoom).toBeVisible();
  }
});

test.describe("tap to activate (touch devices)", () => {
  test.skip(({ hasTouch }) => !hasTouch, "touch devices only");

  test("starts locked with a hint", async ({ page }) => {
    const map = page.locator(".leaflet-container");

    await expect(map).toHaveClass(/map-inactive/);
    await expect(page.locator(".leaflet-touch-drag")).toHaveCount(0);
  });

  test("unlocks when the map is tapped", async ({ page }) => {
    const map = page.locator(".leaflet-container");

    await map.tap({ position: { x: 20, y: 120 } });

    await expect(map).not.toHaveClass(/map-inactive/);
  });

  test("locks again when something outside the map is tapped", async ({
    page,
  }) => {
    const map = page.locator(".leaflet-container");
    await map.tap({ position: { x: 20, y: 120 } });
    await expect(map).not.toHaveClass(/map-inactive/);

    await page.locator("h1").tap();

    await expect(map).toHaveClass(/map-inactive/);
  });
});
