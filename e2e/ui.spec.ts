import { test, expect } from "@playwright/test";
const tabs = [
  "Zlecenia",
  "Pojazd",
  "Kierowca",
  "Baza",
  "Finanse",
  "Historia zdarzeń",
  "Ustawienia",
];
test("all tabs, keyboard navigation and live clock use one running session", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/");
  await expect(page.getByTestId("game-clock")).toHaveText("06:00");
  for (const name of tabs) {
    const tab = page.getByRole("tab", { name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toBeVisible();
    if (name === "Ustawienia")
      await expect(
        page.getByRole("button", { name: "Zapisz", exact: true }),
      ).toBeEnabled();
    else if (name === "Historia zdarzeń")
      await expect(
        page.getByText("Uruchomiono sesję techniczną."),
      ).toBeVisible();
    else
      await expect(
        page.getByRole("heading", { name: "Dostępne w kolejnej fazie" }),
      ).toBeVisible();
  }
  await expect(page.getByTestId("game-clock")).not.toHaveText("06:00", {
    timeout: 4000,
  });
  await page.getByRole("tab", { name: "Ustawienia", exact: true }).focus();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("tab", { name: "Zlecenia", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Pojazd", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Ustawienia", exact: true }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
for (const size of [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]) {
  test(`desktop layout is usable at ${size.width}×${size.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    const management = await page
      .getByRole("complementary", { name: "Zarządzanie" })
      .boundingBox();
    const map = await page
      .getByRole("region", { name: "Obszar operacyjny" })
      .boundingBox();
    const timeline = await page
      .getByRole("region", { name: "Harmonogram", exact: true })
      .boundingBox();
    expect(management!.x + management!.width).toBeLessThan(map!.x);
    expect(map!.y + map!.height).toBeLessThanOrEqual(timeline!.y);
    expect(
      management!.width / (management!.width + map!.width),
    ).toBeGreaterThan(0.3);
    expect(management!.width / (management!.width + map!.width)).toBeLessThan(
      0.4,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const name of tabs) {
      await page.getByRole("tab", { name, exact: true }).click();
      await expect(page.getByRole("tabpanel")).toBeInViewport();
    }
    await expect(
      page.getByRole("button", { name: "Importuj", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("heading", { name: "Mapa Polski — etap 04" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Harmonogram", exact: true }),
    ).toBeInViewport();
    await expect(page.locator(".footer")).toBeInViewport();
    await page.screenshot({
      path: `/tmp/pixelcargo-${size.width}.png`,
      fullPage: true,
    });
  });
}
test("small screen uses stacked panels and preserves keyboard access", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("tab", { name: "Ustawienia", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zapisz", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
