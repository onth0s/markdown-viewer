import { test, expect } from '@playwright/test';

test.describe('Markdown Viewer Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app served locally (default port is 5001)
    await page.goto('http://localhost:5001/');
  });

  test('should load the page and render default content', async ({ page }) => {
    // Verify title
    await expect(page).toHaveTitle(/Markdown Viewer/);

    // Verify main structures exist
    const editor = page.locator('#editor');
    const output = page.locator('#output');
    await expect(editor).toBeVisible();
    await expect(output).toBeVisible();

    // Verify output initially has some rendered content (from DEFAULT.md)
    await expect(output).not.toBeEmpty();
  });

  test('should compile typed markdown into HTML in real-time', async ({ page }) => {
    const editor = page.locator('#editor');
    const output = page.locator('#output');

    // Clear and type new markdown
    await editor.fill('# Hello Spec\nThis is a **bold** statement.');

    // Verify output rendering
    await expect(output.locator('h1')).toHaveText('Hello Spec');
    await expect(output.locator('strong')).toHaveText('bold');
  });

  test('should toggle dark/light theme options', async ({ page }) => {
    const html = page.locator('html');
    const themeBtn = page.locator('.theme-toggle');

    // Store initial theme attribute
    const initialTheme = await html.getAttribute('data-theme');

    // Click theme toggle button
    await themeBtn.click();

    // Verify theme attribute toggled
    const newTheme = await html.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });
});
