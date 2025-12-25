import { test, expect } from "@playwright/test";

test.describe("Learning Hub", () => {
  test("learn dashboard loads without JS errors", async ({ page }) => {
    const errors: string[] = [];

    // Capture console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`Console: ${msg.text()}`);
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on("pageerror", (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto("/learn");
    await page.waitForLoadState("networkidle");

    // Basic content check
    await expect(page.locator("h1")).toBeVisible();

    // No JS errors should have occurred
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

    // Check content loaded
    await expect(page.locator("h1")).toBeVisible();

    // No JS errors
    expect(errors).toEqual([]);
  });

  test("glossary page loads without JS errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`Console: ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto("/learn/glossary");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("commands page loads without JS errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`Console: ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto("/learn/commands");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
