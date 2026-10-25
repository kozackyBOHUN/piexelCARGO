/** Reproducible screenshots of the actual built application, not drawn mockups.
 * npm run build, start vite preview, then: node scripts/capture-map.mjs [preview URL]
 */
import { chromium, expect } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
const url = process.argv[2] ?? "http://127.0.0.1:4173";
const directory = "docs/screenshots/04C";
mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
const performanceResults = [];
const southOnly = process.argv.includes("--south-only");
try {
  for (const [width, height] of [
    [1366, 768],
    [1920, 1080],
  ]) {
    for (const scene of southOnly
      ? ["south"]
      : ["country", "demo", "krakow", "south"]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(url);
      const layer = page.locator('[data-layer="landscape"]');
      await expect(layer).toHaveAttribute("data-landscape-status", "ready");
      await expect(layer).toHaveAttribute("data-water-status", "ready");
      if (scene === "demo")
        await page
          .getByRole("button", { name: "Obszar demo", exact: true })
          .click();
      if (scene === "krakow" || scene === "south") {
        const input = page.getByRole("combobox", {
          name: "Znajdź miasto",
          exact: true,
        });
        await input.fill(scene === "south" ? "zakopane" : "krakow");
        await input.press("Enter");
        await input.evaluate((element) => element.blur());
      }
      if (scene === "south") {
        // Southern close-up: real Tatry/Podhale relief at the specified maximum zoom.
        for (let i = 0; i < 4; i++) {
          await page
            .getByRole("button", { name: "Przybliż mapę", exact: true })
            .click();
          await expect
            .poll(async () =>
              Number(
                await page
                  .getByTestId("poland-map")
                  .getAttribute("data-ground-resolution"),
              ),
            )
            .toBeCloseTo(Math.max(200, 500 / 1.35 ** (i + 1)), 2);
        }
      }
      await page.screenshot({
        path: `${directory}/final-${scene}-${width}.jpg`,
        type: "jpeg",
        quality: 82,
        fullPage: true,
      });
      expect(errors).toEqual([]);
      await context.close();
    }
    if (southOnly) continue;
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(url);
    const layer = page.locator('[data-layer="landscape"]');
    await expect(layer).toHaveAttribute("data-landscape-status", "ready");
    await page
      .getByRole("button", { name: "Obszar demo", exact: true })
      .click();
    await page.evaluate(() => {
      window.__drawTimes = [];
      window.__frameTimes = [];
      window.__trackFrames = true;
      const canvas = document.querySelector('[data-layer="landscape"]');
      window.__observer = new MutationObserver(() =>
        window.__drawTimes.push(Number(canvas.dataset.drawMs)),
      );
      window.__observer.observe(canvas, {
        attributes: true,
        attributeFilter: ["data-draw-ms"],
      });
      let last;
      function frame(now) {
        if (last !== undefined) window.__frameTimes.push(now - last);
        last = now;
        if (window.__trackFrames) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    const rect = await page.getByTestId("poland-map").boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    for (let i = 0; i < 60; i++)
      await page.mouse.move(
        rect.x + rect.width / 2 + Math.sin(i / 6) * 60,
        rect.y + rect.height / 2 + Math.cos(i / 6) * 15,
      );
    await page.mouse.up();
    const measured = await page.evaluate(() => {
      window.__trackFrames = false;
      window.__observer.disconnect();
      const stats = (values) => {
        const sorted = values.sort((a, b) => a - b);
        return {
          samples: sorted.length,
          median: sorted[Math.floor(sorted.length / 2)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          max: sorted.at(-1),
        };
      };
      return {
        canvasDrawMs: stats(window.__drawTimes),
        rafIntervalMs: stats(window.__frameTimes),
        svgElements: document.querySelectorAll(
          '[data-testid="poland-map"] svg *',
        ).length,
        canvasCount: document.querySelectorAll(
          '[data-testid="poland-map"] canvas',
        ).length,
      };
    });
    performanceResults.push({ width, height, ...measured });
    await context.close();
  }
  if (!southOnly)
    writeFileSync(
      `${directory}/performance.json`,
      JSON.stringify(
        {
          environment:
            "Chromium headless, current Codex cloud; not a physical laptop benchmark",
          scenario:
            "60 captured pointer moves in demo view; warmed local assets",
          results: performanceResults,
        },
        null,
        2,
      ) + "\n",
    );
  console.log(JSON.stringify(performanceResults, null, 2));
} finally {
  await browser.close();
}
