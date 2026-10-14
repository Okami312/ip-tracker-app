import { defineConfig } from "@playwright/test";

const port = 5173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: "chromium",
  },
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "mobile",
      use: {
        viewport: { width: 375, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "tablet",
      use: {
        viewport: { width: 768, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 800 } },
    },
  ],
});
