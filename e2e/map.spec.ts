import { test, expect } from "@playwright/test";
for (const size of [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]) {
  test(`real local map and demo cities work at ${size.width}×${size.height}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const external: string[] = [];
    page.on("request", (request) => {
      if (
        !request.url().startsWith("http://127.0.0.1:5173") &&
        !request.url().startsWith("ws://127.0.0.1:5173")
      )
        external.push(request.url());
    });
    await page.setViewportSize(size);
    await page.goto("/");
    const map = page.getByTestId("poland-map");
    await expect(map.locator('[data-layer="voivodeships"] path')).toHaveCount(
      16,
    );
    await expect(map.locator('[data-layer="country"] path')).toHaveAttribute(
      "d",
      /^M/,
    );
    await expect(map.getByRole("button")).toHaveCount(19);
    await expect(
      page.getByText("Pełna sieć miast, drogi i trasy", { exact: false }),
    ).toBeVisible();
    await page.screenshot({
      path: `/tmp/pixelcargo-04A-country-${size.width}.png`,
      fullPage: true,
    });
    const before = await map.locator(".country-outline").getAttribute("d");
    await page
      .getByRole("button", { name: "Obszar demo", exact: true })
      .click();
    await expect(
      page.getByRole("group", {
        name: "Mapa demonstracyjna województwa małopolskiego",
        exact: true,
      }),
    ).toBeVisible();
    expect(await map.locator(".country-outline").getAttribute("d")).not.toBe(
      before,
    );
    await page
      .getByLabel("Miasto demonstracyjne")
      .selectOption("geonames:3094802");
    await expect(page.getByLabel("Położenie miasta")).toContainText("Kraków");
    await expect(page.getByLabel("Położenie miasta")).toContainText(
      "50.0614° N, 19.9366° E",
    );
    await expect(
      map.getByRole("button", { name: "Miasto: Kraków", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await map
      .getByRole("button", { name: "Miasto: Tarnów", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Położenie miasta")).toContainText("Tarnów");
    await page.getByRole("tab", { name: "Ustawienia", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Zapisz", exact: true }),
    ).toBeEnabled();
    await expect(map).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/pixelcargo-04A-demo-${size.width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}
test("data credits are accessible and include both data licenses", async ({
  page,
}) => {
  await page.goto("/map-sources.html");
  await expect(
    page.getByRole("heading", { name: "Źródła mapy PixelCargo", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "MIT — polska-geojson", exact: true }),
  ).toHaveAttribute("href", "/licenses/polska-geojson-MIT.txt");
  await expect(
    page.getByRole("link", { name: "CC BY 4.0", exact: true }),
  ).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
});
test("map data failure is recoverable and does not stop the clock", async ({
  page,
}) => {
  let block = true;
  await page.route("**/src/world/data/voivodeships.json", async (route) => {
    if (block) await route.fulfill({ status: 503, body: "unavailable" });
    else await route.continue();
  });
  await page.goto("/");
  await expect(
    page.getByText("Nie udało się wczytać lokalnych danych mapy.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("game-clock")).not.toHaveText("06:00", {
    timeout: 4000,
  });
  block = false;
  await page.getByRole("button", { name: "Ponów wczytywanie mapy" }).click();
  await expect(
    page.getByTestId("poland-map").locator('[data-layer="voivodeships"] path'),
  ).toHaveCount(16);
});
