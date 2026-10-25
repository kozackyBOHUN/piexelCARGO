import { test, expect, type Page } from "@playwright/test";
async function camera(page: Page) {
  return page.getByTestId("poland-map").evaluate((element) => ({
    scale: Number(element.getAttribute("data-map-scale")),
    x: Number(element.getAttribute("data-offset-x")),
    y: Number(element.getAttribute("data-offset-y")),
    width: Number(element.getAttribute("data-width")),
    height: Number(element.getAttribute("data-height")),
    resolution: Number(element.getAttribute("data-ground-resolution")),
  }));
}
async function ready(page: Page) {
  await page.goto("/?dev=1");
  await expect(page.locator('[data-layer="voivodeships"] path')).toHaveCount(
    16,
  );
}
async function search(page: Page, query: string) {
  const input = page.getByRole("combobox", {
    name: "Znajdź miasto",
    exact: true,
  });
  await input.fill(query);
  await expect(
    page.getByRole("listbox", { name: "Pasujące miasta" }),
  ).toBeVisible();
  return input;
}
for (const size of [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]) {
  test(`cursor zoom, drag, limits, reset, scale and selection at ${size.width}×${size.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await ready(page);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const initial = await camera(page);
    const map = page.getByTestId("poland-map");
    await expect(
      page.getByRole("button", { name: "Oddal mapę", exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Obszar demo", exact: true })
      .click();
    expect((await camera(page)).scale).toBeGreaterThan(initial.scale);
    const input = await search(page, "KRAKOW");
    await input.press("Enter");
    await expect(page.getByLabel("Położenie miasta")).toContainText("Kraków");
    const marker = map.getByRole("button", {
      name: "Miasto: Kraków",
      exact: true,
    });
    await expect(marker).toHaveAttribute("aria-pressed", "true");
    const before = await camera(page),
      box = (await map.boundingBox())!;
    const anchor = {
      x: Math.round(box.x + box.width / 2 + 20),
      y: Math.round(box.y + box.height / 2 + 4),
    };
    const local = { x: anchor.x - box.x, y: anchor.y - box.y };
    const world = {
      x: (local.x - before.x) / before.scale,
      y: (local.y - before.y) / before.scale,
    };
    await page.mouse.move(anchor.x, anchor.y);
    await page.mouse.wheel(0, -100);
    await expect
      .poll(async () => (await camera(page)).scale)
      .toBeGreaterThan(before.scale);
    const after = await camera(page);
    expect(world.x * after.scale + after.x).toBeCloseTo(local.x, 2);
    expect(world.y * after.scale + after.y).toBeCloseTo(local.y, 2);
    const scale = page.getByTestId("map-scale");
    const bar = (await scale.locator("i").boundingBox())!;
    const centerLatitude =
      2 *
        Math.atan(
          Math.exp(
            -((bar.y + bar.height - 0.5 - box.y - after.y) / after.scale) /
              6378137,
          ),
        ) -
      Math.PI / 2;
    const measured =
      Number(await scale.getAttribute("data-meters")) / bar.width;
    expect(measured / (Math.cos(centerLatitude) / after.scale)).toBeCloseTo(
      1,
      2,
    );
    await page
      .getByRole("button", { name: "Przybliż mapę", exact: true })
      .click();
    await expect
      .poll(async () => (await camera(page)).scale)
      .toBeGreaterThan(after.scale * 1.25);
    await page.waitForTimeout(180);
    const zoomed = await camera(page);
    await page.getByRole("button", { name: "Oddal mapę", exact: true }).click();
    await expect
      .poll(async () => (await camera(page)).scale)
      .toBeLessThan(zoomed.scale * 0.8);
    await page.waitForTimeout(180);
    // Begin on a city marker. A drag must move the map rather than select the city.
    await page.getByLabel("Miasto demonstracyjne").selectOption("");
    const hit = (await marker.locator(".city-hit-area").boundingBox())!;
    const start = { x: hit.x + hit.width / 2, y: hit.y + hit.height / 2 };
    const preDrag = await camera(page);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 36, start.y + 10, { steps: 6 });
    await page.mouse.up();
    const dragged = await camera(page);
    expect(dragged.x - preDrag.x).toBeCloseTo(36, 1);
    expect(dragged.y - preDrag.y).toBeCloseTo(10, 1);
    await expect(marker).toHaveAttribute("aria-pressed", "false");
    await expect(map).not.toHaveClass(/is-dragging/);
    await marker.click();
    await expect(marker).toHaveAttribute("aria-pressed", "true");
    // Boundaries stay cached; the shared transform moves every geographic layer.
    const path = await map.locator(".country-outline").getAttribute("d");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -2000);
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -2000);
    await expect
      .poll(async () => (await camera(page)).resolution)
      .toBeCloseTo(200, 3);
    await expect(
      page.getByRole("button", { name: "Przybliż mapę", exact: true }),
    ).toBeDisabled();
    expect(await map.locator(".country-outline").getAttribute("d")).toBe(path);
    const max = await camera(page);
    await page.mouse.wheel(0, -1000);
    expect((await camera(page)).scale).toBeCloseTo(max.scale, 8);
    // Large captured drag is constrained even when the pointer leaves the viewport.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 2500,
      box.y + box.height / 2 + 2500,
      { steps: 8 },
    );
    await page.mouse.up();
    expect((await camera(page)).resolution).toBeGreaterThanOrEqual(199.999);
    await page
      .getByRole("button", { name: "Cała Polska", exact: true })
      .click();
    expect((await camera(page)).scale).toBeCloseTo(initial.scale, 10);
    expect((await camera(page)).x).toBeCloseTo(initial.x, 6);
    expect((await camera(page)).y).toBeCloseTo(initial.y, 6);
    await page
      .getByRole("button", { name: "Obszar demo", exact: true })
      .click();
    await page.getByRole("tab", { name: "Ustawienia", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Zapisz", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("region", { name: "Harmonogram", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: `/tmp/pixelcargo-04B-${size.width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
test("search handles partial Polish/ascii names, Enter, arrows, mouse and Escape", async ({
  page,
}) => {
  await ready(page);
  const input = await search(page, "sAcZ");
  await expect(page.getByRole("listbox").getByRole("option")).toContainText(
    "Nowy Sącz",
  );
  await input.press("Enter");
  await expect(page.getByLabel("Położenie miasta")).toContainText("Nowy Sącz");
  const map = page.getByTestId("poland-map");
  const c = await camera(page);
  const cityBox = (await map
    .getByRole("button", { name: "Miasto: Nowy Sącz", exact: true })
    .locator(".city-marker")
    .boundingBox())!;
  const box = (await map.boundingBox())!;
  expect(cityBox.x + cityBox.width / 2 - box.x).toBeCloseTo(c.width / 2, 1);
  expect(cityBox.y + cityBox.height / 2 - box.y).toBeCloseTo(c.height / 2, 1);
  await input.fill("oswiec");
  await page
    .getByRole("option", { name: "Oświęcim małopolskie", exact: true })
    .click();
  await expect(page.getByLabel("Położenie miasta")).toContainText("Oświęcim");
  await input.fill("NOWY");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(2);
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page.getByLabel("Położenie miasta")).toContainText("Nowy Targ");
  await input.fill("tar");
  await expect(page.getByRole("listbox")).toBeVisible();
  await input.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await input.fill("Warszawa");
  await expect(
    page.getByText("Nie znaleziono miasta w zestawie demo."),
  ).toBeVisible();
  await expect(page.getByText("Tylko 19 miast demonstracyjnych")).toBeVisible();
  await input.fill("");
  await expect(page.getByRole("listbox")).toHaveCount(0);
});
test("resize preserves centered city and min zoom refits Poland; max zoom uses CSS pixels at DPR 2", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2,
  });
  try {
    const page = await context.newPage();
    await ready(page);
    const input = await search(page, "krak");
    await input.press("Enter");
    const before = await camera(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect
      .poll(async () => (await camera(page)).width)
      .toBeGreaterThan(before.width);
    const after = await camera(page);
    expect((before.width / 2 - before.x) / before.scale).toBeCloseTo(
      (after.width / 2 - after.x) / after.scale,
      5,
    );
    expect((before.height / 2 - before.y) / before.scale).toBeCloseTo(
      (after.height / 2 - after.y) / after.scale,
      5,
    );
    expect(after.resolution).toBeCloseTo(before.resolution, 6);
    const box = (await page.getByTestId("poland-map").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -2000);
    await expect
      .poll(async () => (await camera(page)).resolution)
      .toBeCloseTo(200, 3);
    await page
      .getByRole("button", { name: "Cała Polska", exact: true })
      .click();
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect
      .poll(async () => (await camera(page)).width)
      .toBeCloseTo(before.width, 1);
    await expect(
      page.getByRole("button", { name: "Oddal mapę", exact: true }),
    ).toBeDisabled();
  } finally {
    await context.close();
  }
});
test("overlapping markers at country view offer a real city choice", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await ready(page);
  const marker = page.getByRole("button", {
    name: "Miasto: Kraków",
    exact: true,
  });
  const box = (await marker.locator(".city-marker").boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const choices = page.getByLabel("Wybierz miasto z grupy");
  await expect(choices).toBeVisible();
  await choices.getByRole("button", { name: "Kraków", exact: true }).click();
  await expect(marker).toHaveAttribute("aria-pressed", "true");
});

test("quick consecutive zoom clicks accumulate and dragging never consumes the next control click", async ({
  page,
}) => {
  await ready(page);
  const input = await search(page, "krakow");
  await input.press("Enter");
  const before = await camera(page);
  await page
    .getByRole("button", { name: "Przybliż mapę", exact: true })
    .dblclick();
  await expect
    .poll(async () => (await camera(page)).scale)
    .toBeCloseTo(before.scale * 1.35 ** 2, 7);
  const map = page.getByTestId("poland-map"),
    box = (await map.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 3000,
    box.y + box.height / 2 + 3000,
    { steps: 5 },
  );
  await page.mouse.up();
  const dragged = await camera(page);
  await page.getByRole("button", { name: "Oddal mapę", exact: true }).click();
  await expect
    .poll(async () => (await camera(page)).scale)
    .toBeLessThan(dragged.scale * 0.9);
});
