import { test, expect, type Page } from "@playwright/test";
const envelope = (time = 36_900_000) => ({
  schemaVersion: 1,
  saveId: "import-test",
  savedAt: "2000-01-01T00:00:00.000Z",
  state: {
    time,
    rngState: 123456,
    company: null,
    commandSequence: 7,
    events: [
      { id: "session-started", type: "session-started", at: 21_600_000 },
    ],
  },
});
async function ready(page: Page) {
  await page.goto("/");
  await page.getByRole("tab", { name: "Ustawienia", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zapisz", exact: true }),
  ).toBeEnabled();
}
async function importFile(page: Page, value: unknown) {
  await page.getByLabel("Plik zapisu").setInputFiles({
    name: "zapis.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(value)),
  });
}
async function readSave(page: Page) {
  return page.evaluate(
    () =>
      new Promise<any>((resolve, reject) => {
        const request = indexedDB.open("pixelcargo-v1", 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("saves");
          const get = tx.objectStore("saves").get("current");
          tx.oncomplete = () => {
            db.close();
            resolve(get.result);
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
}
test("manual save, export, import and reload without offline progress", async ({
  page,
}) => {
  await ready(page);
  await importFile(page, envelope());
  await expect(page.getByRole("status")).toContainText("Zaimportowano zapis.");
  await expect(page.getByTestId("game-clock")).toContainText("10:15");
  const persisted = await readSave(page);
  expect(persisted).toEqual(envelope());
  await page.reload();
  await page.getByRole("tab", { name: "Ustawienia", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zapisz", exact: true }),
  ).toBeEnabled();
  await expect(page.getByTestId("game-clock")).toContainText("10:15");
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Zapisano pomyślnie.");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj", exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("pixelcargo-zapis.json");
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.state.rngState).toBe(123456);
  expect(exported.state.events).toHaveLength(1);
  expect(exported.state.time).toBeGreaterThanOrEqual(envelope().state.time);
  expect(exported.state.time).toBeLessThan(envelope().state.time + 120_000);
});
test("bad import reports error and preserves durable state", async ({
  page,
}) => {
  await ready(page);
  await importFile(page, envelope());
  await expect(page.getByRole("status")).toContainText("Zaimportowano");
  const before = await readSave(page);
  await importFile(page, { schemaVersion: 999 });
  await expect(page.getByRole("status")).toContainText("Nieobsługiwana wersja");
  expect(await readSave(page)).toEqual(before);
  await page.getByLabel("Plik zapisu").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });
  await expect(page.getByRole("status")).toContainText("JSON");
});
test("second tab cannot simulate or save; closing owner transfers lock and restores save", async ({
  page,
  context,
}) => {
  await ready(page);
  await importFile(page, envelope());
  await expect(page.getByRole("status")).toContainText("Zaimportowano");
  const second = await context.newPage();
  await second.goto("/");
  await second.getByRole("tab", { name: "Ustawienia", exact: true }).click();
  await expect(second.getByRole("alert")).toContainText("nie nalicza czasu");
  await expect(
    second.getByRole("button", { name: "Zapisz", exact: true }),
  ).toBeDisabled();
  const blockedTime = await second.getByTestId("game-clock").textContent();
  await second.waitForTimeout(1200);
  expect(await second.getByTestId("game-clock").textContent()).toBe(
    blockedTime,
  );
  await page.close();
  await expect(
    second.getByRole("button", { name: "Zapisz", exact: true }),
  ).toBeEnabled();
  await expect(second.getByTestId("game-clock")).toContainText("10:");
  await second.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(second.getByRole("status")).toContainText("Zapisano");
  expect((await readSave(second)).saveId).toBe("import-test");
});
test("autosave has bounded cadence while clock runs", async ({ page }) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    (window as any).writes = 0;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      (window as any).writes++;
      return original.apply(this, args);
    };
  });
  await ready(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).writes), {
      timeout: 13_000,
    })
    .toBe(1);
  const save = await readSave(page);
  expect(save.state.time).toBeGreaterThan(21_600_000);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => (window as any).writes)).toBe(1);
});
test("unsupported locking blocks simulation instead of using unsafe fallback", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "locks", { value: undefined }),
  );
  await page.goto("/");
  await page.getByRole("tab", { name: "Ustawienia", exact: true }).click();
  await expect(page.getByTestId("save-status")).toContainText("Web Locks");
  await expect(
    page.getByRole("button", { name: "Zapisz", exact: true }),
  ).toBeDisabled();
  const time = await page.getByTestId("game-clock").textContent();
  await page.waitForTimeout(1100);
  expect(await page.getByTestId("game-clock").textContent()).toBe(time);
});
test("storage startup failure is visible and cannot silently start unsaved session", async ({
  page,
}) => {
  await page.addInitScript(() => {
    indexedDB.open = () => {
      throw new Error("Odmowa dostępu do IndexedDB");
    };
  });
  await page.goto("/");
  await page.getByRole("tab", { name: "Ustawienia", exact: true }).click();
  await expect(page.getByTestId("save-status")).toContainText("Odmowa dostępu");
  await expect(
    page.getByRole("button", { name: "Zapisz", exact: true }),
  ).toBeDisabled();
});

test("failed durable write reports error and does not replace live state on import", async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = () => {
      throw new Error("Brak miejsca na zapis w przeglądarce.");
    };
  });
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Brak miejsca");
  await expect(page.getByText("Błąd zapisu", { exact: true })).toBeVisible();
  await importFile(page, envelope());
  await expect(page.getByRole("status")).toContainText("Brak miejsca");
  await expect(page.getByTestId("game-clock")).not.toContainText("10:15");
  expect(await readSave(page)).toBeUndefined();
});
