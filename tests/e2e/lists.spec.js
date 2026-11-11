import {
  DEPARTMENT, EMAIL, NAME, SALARY, cell, cellText, events, expect, expectEditing, expectNoList, expectViewing, fill,
  focusCell, input, lastEvent, listItems, listTitles, open, searches, sounds, startEdit, test,
} from "./helpers.js";

const IT = "IT (Information technology and something more just for text)";

test.describe("autocompletion", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("the list shows titles and subtitles of items", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await page.keyboard.press("ArrowDown");
    await expect(listTitles(page)).toHaveText(["HR", "IT", "Finance", "Sales", "Operations", "Legal"]);
    await expect(listItems(page).nth(2)).toContainText("Accounting and finance");
  });

  test("the list is filtered by the title", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await fill(page, 0, DEPARTMENT, "fin");
    await expect(listTitles(page)).toHaveText(["Finance"]);
  });

  test("the list is filtered by the subtitle", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await fill(page, 0, DEPARTMENT, "logistics");
    await expect(listTitles(page)).toHaveText(["Operations"]);
  });

  test("the item is selected with the keyboard", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await fill(page, 0, DEPARTMENT, "fin");
    await expect(listTitles(page)).toHaveText(["Finance"]);
    await page.keyboard.press("Enter");
    await expectNoList(page);
    await expect(input(page, 0, DEPARTMENT)).toHaveValue("Finance");
    await expectEditing(page, 0, DEPARTMENT);
    await page.keyboard.press("Enter");
    await expectViewing(page, 0, DEPARTMENT);
    await expect(cellText(page, 0, DEPARTMENT)).toHaveText("Finance (Accounting and finance)");
  });

  test("the item is selected with the mouse", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await page.keyboard.press("ArrowDown");
    await listItems(page).filter({ hasText: "Sales" }).click();
    await expect(input(page, 0, DEPARTMENT)).toHaveValue("Sales");
    await page.keyboard.press("Enter");
    await expect(cellText(page, 0, DEPARTMENT)).toHaveText("Sales (Sales and marketing)");
  });

  test("the selected object is saved to the row", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await fill(page, 0, DEPARTMENT, "legal");
    await expect(listTitles(page)).toHaveText(["Legal"]);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect(cellText(page, 0, DEPARTMENT)).toHaveText("Legal (Legal and compliance)");
    const updated = await lastEvent(page, "update");
    expect(updated[0].department).toEqual({ value: 6, title: "Legal", subtitle: "Legal and compliance" });
  });
});

test.describe("opening of the list", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("typing in non-editing mode filters the list by the typed text", async ({ page }) => {
    await open(page, { filterSubtitle: false });
    await focusCell(page, 0, DEPARTMENT);
    await page.keyboard.type("f");
    await expectEditing(page, 0, DEPARTMENT);
    await expect(input(page, 0, DEPARTMENT)).toHaveValue("f");
    await expect(listTitles(page)).toHaveText(["Finance"]);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expectViewing(page, 0, DEPARTMENT);
    await expect(cellText(page, 0, DEPARTMENT)).toHaveText("Finance (Accounting and finance)");
  });

  test("the list is opened again when the text is changed to matching one", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await fill(page, 0, DEPARTMENT, "opx");
    await expectNoList(page);
    await page.keyboard.press("Backspace");
    await expect(listTitles(page)).toHaveText(["Operations"]);
  });

  test("the list is opened again when the text is changed quickly", async ({ page }) => {
    await open(page, { filterSubtitle: false });
    await startEdit(page, 0, DEPARTMENT);
    await input(page, 0, DEPARTMENT).selectText();
    await page.keyboard.type("ox");
    await page.keyboard.press("Backspace");
    await expect(input(page, 0, DEPARTMENT)).toHaveValue("o");
    await expect(listTitles(page)).toHaveText(["Operations"]);
  });

  test("the list closed with Esc stays closed until the text is changed", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await fill(page, 0, DEPARTMENT, "fin");
    await expect(listTitles(page)).toHaveText(["Finance"]);
    await page.keyboard.press("Escape");
    await expectNoList(page);
    await page.waitForTimeout(300);
    await expectNoList(page);
    await page.keyboard.type("a");
    await expect(listTitles(page)).toHaveText(["Finance"]);
  });

  test("the list is not opened when the cell is switched to editing mode", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await page.waitForTimeout(300);
    await expectNoList(page);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Enter");
    await expectEditing(page, 0, DEPARTMENT);
    await page.waitForTimeout(300);
    await expectNoList(page);
  });
});

test.describe("exact", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("the value out of the list is declined", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await fill(page, 0, DEPARTMENT, "Unknown");
    await expectNoList(page);
    await page.keyboard.press("Enter");
    await expectViewing(page, 0, DEPARTMENT);
    await expect(cellText(page, 0, DEPARTMENT)).toHaveText(IT);
    expect(await events(page, "validationError")).toEqual([]);
  });

  test("the value out of the list is accepted when exact is false", async ({ page }) => {
    await startEdit(page, 0, SALARY);
    await fill(page, 0, SALARY, "1300");
    await page.keyboard.press("Enter");
    await expectViewing(page, 0, SALARY);
    await expect(cellText(page, 0, SALARY)).toHaveText("$1300");
  });

  test("the value from the list of simple values is selected", async ({ page }) => {
    await startEdit(page, 0, SALARY);
    await fill(page, 0, SALARY, "15");
    await expect(listTitles(page)).toHaveText(["1500"]);
    await page.keyboard.press("Enter");
    await expect(input(page, 0, SALARY)).toHaveValue("1500");
    await page.keyboard.press("Enter");
    await expect(cellText(page, 0, SALARY)).toHaveText("$1500");
  });
});

test.describe("filterSubtitle", () => {
  test("the list is not filtered by the subtitle when disabled", async ({ page }) => {
    await open(page, { filterSubtitle: false });
    await startEdit(page, 0, DEPARTMENT);
    await fill(page, 0, DEPARTMENT, "logistics");
    await expectNoList(page);
    await fill(page, 0, DEPARTMENT, "oper");
    await expect(listTitles(page)).toHaveText(["Operations"]);
  });
});

test.describe("dynamic loading of items", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, { rows: "empty" });
  });

  test("the search function is called with the typed text", async ({ page }) => {
    await startEdit(page, 0, EMAIL);
    await fill(page, 0, EMAIL, "geo");
    await expect(listTitles(page)).toHaveCount(2);
    expect(await searches(page)).toContain("geo");
  });

  test("the list shows the found items", async ({ page }) => {
    await startEdit(page, 0, EMAIL);
    await fill(page, 0, EMAIL, "geo");
    await expect(listTitles(page)).toHaveText(["george.bluth@example.com", "george.edwards@example.com"]);
    await expect(listItems(page).nth(1)).toContainText("George Edwards");
    await fill(page, 0, EMAIL, "wong");
    await expect(listTitles(page)).toHaveText(["emma.wong@example.com"]);
  });

  test("the list is opened when the found items replace the previous ones", async ({ page }) => {
    await startEdit(page, 0, EMAIL);
    await fill(page, 0, EMAIL, "geo");
    await expect(listTitles(page)).toHaveCount(2);
    await fill(page, 0, EMAIL, "janet");
    await expect(listTitles(page)).toHaveText(["janet.weaver@example.com"]);
  });

  test("the list is not opened when the cell with the value is switched to editing mode", async ({ page }) => {
    await open(page);
    await startEdit(page, 0, EMAIL);
    await expect(input(page, 0, EMAIL)).toHaveValue("george.bluth@example.com");
    await page.waitForTimeout(300);
    await expectNoList(page);
  });

  test("the found item is selected with the mouse", async ({ page }) => {
    await startEdit(page, 0, EMAIL);
    await fill(page, 0, EMAIL, "geo");
    await listItems(page).filter({ hasText: "George Edwards" }).click();
    await expect(input(page, 0, EMAIL)).toHaveValue("george.edwards@example.com");
    await page.keyboard.press("Enter");
    await expectViewing(page, 0, EMAIL);
    await expect(cellText(page, 0, EMAIL)).toHaveText("george.edwards@example.com");
    const updated = await lastEvent(page, "update");
    expect(updated[0].email).toMatchObject({ id: 5, value: "george.edwards@example.com", subtitle: "George Edwards" });
  });

  test("the found item is selected with the keyboard", async ({ page }) => {
    await startEdit(page, 0, EMAIL);
    await fill(page, 0, EMAIL, "emma");
    await expect(listTitles(page)).toHaveText(["emma.wong@example.com"]);
    await page.keyboard.press("Enter");
    await expect(input(page, 0, EMAIL)).toHaveValue("emma.wong@example.com");
    await page.keyboard.press("Enter");
    await expectViewing(page, 0, EMAIL);
    await expect(cellText(page, 0, EMAIL)).toHaveText("emma.wong@example.com");
  });

  test("the found item is selected from the list with arrows", async ({ page }) => {
    await startEdit(page, 0, EMAIL);
    await fill(page, 0, EMAIL, "geo");
    await expect(listTitles(page)).toHaveCount(2);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(input(page, 0, EMAIL)).toHaveValue("george.edwards@example.com");
    await page.keyboard.press("Enter");
    await expect(cellText(page, 0, EMAIL)).toHaveText("george.edwards@example.com");
  });
});

test.describe("custom validation and format", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, { rows: "empty" });
  });

  test("the validation function fills another cell of the row", async ({ page }) => {
    await startEdit(page, 0, EMAIL);
    await fill(page, 0, EMAIL, "janet");
    await listItems(page).first().click();
    await page.keyboard.press("Enter");
    await expect(cellText(page, 0, NAME)).toHaveText("Janet Weaver #2");
    const updated = await lastEvent(page, "update");
    expect(updated[0].name).toEqual({ name: "Janet Weaver", id: 2 });
  });

  test("the format with HTML is rendered in the cell", async ({ page }) => {
    await startEdit(page, 0, EMAIL);
    await fill(page, 0, EMAIL, "janet");
    await listItems(page).first().click();
    await page.keyboard.press("Enter");
    await expect(cell(page, 0, NAME).locator("b.user-name")).toHaveText("Janet Weaver");
  });

  test("the validation function declines the value with the message", async ({ page }) => {
    await startEdit(page, 0, EMAIL);
    await page.keyboard.press("Enter");
    await expect.poll(() => events(page, "validationError")).toEqual([
      { rowIndex: 0, columnKey: "email", value: "", message: "Email must be selected" },
    ]);
    await expectEditing(page, 0, EMAIL);
    expect(await sounds(page)).toBe(1);
  });
});
