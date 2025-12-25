import { test, expect } from "@playwright/test";

/**
 * Production smoke tests that run against the live site.
 * These are critical for catching deployment issues.
 *
 * Run with: PLAYWRIGHT_BASE_URL=https://agent-flywheel.com npx playwright test production
 */
test.describe("Production Smoke Tests", () => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL?.includes("agent-flywheel.com"),
    "Only runs against production"
  );

  test("homepage loads without JS errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`Console: ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("learn dashboard loads without JS errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`Console: ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto("/learn");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("lesson page loads without JS errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`Console: ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto("/learn/welcome");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
