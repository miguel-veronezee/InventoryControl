import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("mostra o produto e o aviso de desenvolvimento", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Controle de pedidos");
  await expect(page.getByText("Em desenvolvimento")).toBeVisible();
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`sem violações WCAG A/AA no tema ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(violations).toEqual([]);
  });
}

test("sem rolagem horizontal no celular", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
});
