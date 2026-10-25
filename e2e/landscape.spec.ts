import { test, expect } from "@playwright/test";
test("local water canvas has LOD, culling and never captures map interaction", async ({
  page,
}) => {
  await page.goto("/");
  const layer = page.locator('[data-layer="landscape"]');
  await expect(layer).toHaveAttribute("data-water-status", "ready");
  expect(
    await layer.evaluate((element) => getComputedStyle(element).pointerEvents),
  ).toBe("none");
  await expect(layer).toHaveAttribute("data-water-total", "54");
  const input = page.getByRole("combobox", {
    name: "Znajdź miasto",
    exact: true,
  });
  await input.fill("krakow");
  await input.press("Enter");
  await expect(layer).toHaveAttribute("data-water-lod", "2");
  await expect(
    page.getByRole("button", { name: "Miasto: Kraków", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(Number(await layer.getAttribute("data-water-visible"))).toBeLessThan(
    54,
  );
  const box = (await page.getByTestId("poland-map").boundingBox())!;
  const before = await page
    .getByTestId("poland-map")
    .getAttribute("data-offset-x");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 20,
    box.y + box.height / 2 + 10,
    { steps: 5 },
  );
  await page.mouse.up();
  expect(
    await page.getByTestId("poland-map").getAttribute("data-offset-x"),
  ).not.toBe(before);
  await page.getByRole("button", { name: "Cała Polska", exact: true }).click();
  await expect(page.locator('[data-layer="voivodeships"] path')).toHaveCount(
    16,
  );
});
test("hydrography failure can be retried without losing base map or the live game clock", async ({
  page,
}) => {
  let block = true;
  await page.route("**/src/world/data/hydrography.json", async (route) =>
    block
      ? route.fulfill({ status: 503, body: "unavailable" })
      : route.continue(),
  );
  await page.goto("/");
  const retry = page.getByRole("button", {
    name: "Hydrografia niedostępna — ponów wczytywanie.",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await expect(page.getByTestId("game-clock")).not.toHaveText("06:00", {
    timeout: 4000,
  });
  await expect(page.locator('[data-layer="voivodeships"] path')).toHaveCount(
    16,
  );
  block = false;
  await retry.click();
  await expect(page.locator('[data-layer="landscape"]')).toHaveAttribute(
    "data-water-status",
    "ready",
  );
});
test("real terrain and forest LODs share the camera, cull raster pixels and keep SVG bounded", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  const layer = page.locator('[data-layer="landscape"]');
  await expect(layer).toHaveAttribute("data-landscape-status", "ready");
  await expect(layer).toHaveAttribute(
    "data-layer-order",
    "base,elevation,forests,lakes,rivers,boundaries,cities,labels",
  );
  await expect(page.getByTestId("poland-map").locator("canvas")).toHaveCount(1);
  const input = page.getByRole("combobox", {
    name: "Znajdź miasto",
    exact: true,
  });
  await input.fill("krakow");
  await input.press("Enter");
  await expect(layer).toHaveAttribute("data-landscape-lod", "2");
  expect(Number(await layer.getAttribute("data-raster-coverage"))).toBeLessThan(
    0.6,
  );
  expect(
    await page.getByTestId("poland-map").locator("svg *").count(),
  ).toBeLessThan(200);
  await expect(
    page.getByRole("button", { name: "Miasto: Kraków", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("failed raster data can be retried while water, cities and clock stay functional", async ({
  page,
}) => {
  let block = true;
  await page.route("**/landscape/manifest.json", async (route) =>
    block
      ? route.fulfill({ status: 503, body: "unavailable" })
      : route.continue(),
  );
  await page.goto("/");
  const retry = page.getByRole("button", {
    name: "Krajobraz niedostępny — ponów wczytywanie.",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await expect(page.locator('[data-layer="landscape"]')).toHaveAttribute(
    "data-water-status",
    "ready",
  );
  await expect(page.getByTestId("game-clock")).not.toHaveText("06:00", {
    timeout: 4000,
  });
  block = false;
  await retry.click();
  await expect(page.locator('[data-layer="landscape"]')).toHaveAttribute(
    "data-landscape-status",
    "ready",
  );
});
