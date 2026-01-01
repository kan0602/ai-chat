import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the landing page", async ({ page }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(/AI Chat/);

    // Check hero section
    await expect(page.getByRole("heading", { name: "AI Chat" })).toBeVisible();
    await expect(
      page.getByText("エンターテイメント向けAIチャットボット")
    ).toBeVisible();

    // Check login button
    await expect(page.getByRole("button", { name: /Googleでログイン/i })).toBeVisible();
  });

  test("should display feature cards", async ({ page }) => {
    await page.goto("/");

    // Check feature cards
    await expect(page.getByText("自然な会話")).toBeVisible();
    await expect(page.getByText("リアルタイム応答")).toBeVisible();
    await expect(page.getByText("履歴管理")).toBeVisible();
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/");

    // Check header
    await expect(page.getByRole("link", { name: "AI Chat" })).toBeVisible();
  });

  test("should be responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Content should still be visible
    await expect(page.getByRole("heading", { name: "AI Chat" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Googleでログイン/i })).toBeVisible();
  });
});

test.describe("Theme Toggle", () => {
  test("should toggle dark mode", async ({ page }) => {
    await page.goto("/");

    // Find and click theme toggle button
    const themeToggle = page.getByRole("button", { name: /ライトモード|ダークモード/i });

    if (await themeToggle.isVisible()) {
      // Get initial state
      const html = page.locator("html");
      const initialHasDark = await html.evaluate((el) =>
        el.classList.contains("dark")
      );

      // Click toggle
      await themeToggle.click();

      // Check state changed
      const afterHasDark = await html.evaluate((el) =>
        el.classList.contains("dark")
      );

      expect(afterHasDark).not.toBe(initialHasDark);
    }
  });
});

test.describe("Authentication Flow", () => {
  test("should show login button when not authenticated", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: /Googleでログイン/i })).toBeVisible();
  });

  test("should redirect to login when clicking login button", async ({ page }) => {
    await page.goto("/");

    const loginButton = page.getByRole("button", { name: /Googleでログイン/i });
    await loginButton.click();

    // Should navigate to auth page
    await page.waitForURL(/\/api\/auth/);
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Check h1 exists
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();

    // Check h2 for features section
    const h2 = page.getByRole("heading", { level: 2, name: "特徴" });
    await expect(h2).toBeVisible();
  });

  test("should have accessible buttons", async ({ page }) => {
    await page.goto("/");

    // Login button should be focusable
    const loginButton = page.getByRole("button", { name: /Googleでログイン/i });
    await loginButton.focus();
    await expect(loginButton).toBeFocused();
  });
});
