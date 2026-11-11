import {
  DEPARTMENT, EMAIL, PHONE, SALARY, cell, cellText, clearEvents, events, expect, expectEditing, expectViewing, fill,
  focusCell, focusedCell, header, headerCells, input, lastEvent, open, rows, rowTexts, sounds, startEdit, table, test,
} from "./helpers.js";

const border = (locator, side) => locator.evaluate(
  (element, side) => getComputedStyle(element).getPropertyValue(`border-${side}-width`), side);

test.describe("columns and rows", () => {
  test("the header shows the labels of columns", async ({ page }) => {
    await open(page);
    await expect(headerCells(page)).toHaveText(["Email", "Name", "Department", "Phone", "Salary"]);
  });

  test("the rows show formatted values", async ({ page }) => {
    await open(page);
    await expect(rows(page)).toHaveCount(3);
    expect(await rowTexts(page, 0)).toEqual([
      "george.bluth@example.com",
      "George Bluth #1",
      "IT (Information technology and something more just for text)",
      "555-0101",
      "$1000",
    ]);
  });

  test("the empty row is shown when there are no rows", async ({ page }) => {
    await open(page, { rows: "empty" });
    await expect(rows(page)).toHaveCount(1);
    expect(await rowTexts(page, 0)).toEqual(["", "", "", "", ""]);
  });

  test("the table shows new rows when they are changed outside", async ({ page }) => {
    await open(page);
    await page.locator("#replace-rows").click();
    await expect(rows(page)).toHaveCount(1);
    await expect(cellText(page, 0, EMAIL)).toHaveText("janet.weaver@example.com");
  });

  test("the long value is truncated in the cell", async ({ page }) => {
    await open(page);
    const overflow = await cell(page, 0, DEPARTMENT).evaluate(element => ({
      truncated: element.scrollWidth > element.clientWidth,
      textOverflow: getComputedStyle(element).textOverflow,
      height: element.getBoundingClientRect().height,
    }));
    expect(overflow).toEqual({ truncated: true, textOverflow: "ellipsis", height: 48 });
  });
});

test.describe("border", () => {
  test("the header and cells have borders", async ({ page }) => {
    await open(page);
    expect(await border(headerCells(page).nth(1), "right")).toBe("1px");
    expect(await border(headerCells(page).nth(1), "top")).toBe("1px");
    expect(await border(headerCells(page).first(), "left")).toBe("1px");
    expect(await border(cell(page, 1, PHONE), "right")).toBe("1px");
    expect(await border(cell(page, 1, EMAIL), "left")).toBe("1px");
  });

  test("the header and cells have no borders when disabled", async ({ page }) => {
    await open(page, { border: false });
    expect(await border(headerCells(page).nth(1), "right")).toBe("0px");
    expect(await border(headerCells(page).first(), "left")).toBe("0px");
    expect(await border(cell(page, 1, PHONE), "right")).toBe("0px");
    expect(await border(cell(page, 1, EMAIL), "left")).toBe("0px");
    // Rows are always separated
    expect(await border(rows(page).nth(1), "bottom")).toBe("1px");
  });
});

test.describe("noHeader", () => {
  test("the table has no header", async ({ page }) => {
    await open(page, { noHeader: true });
    await expect(header(page)).toHaveCount(0);
    await expect(rows(page)).toHaveCount(3);
    await startEdit(page, 0, PHONE);
  });
});

test.describe("readonly", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, { readonly: true });
  });

  test("click does not switch the cell to editing mode", async ({ page }) => {
    await cell(page, 0, PHONE).click();
    await expect(input(page, 0, PHONE)).toBeHidden();
    await expect(focusedCell(page)).toHaveCount(0);
    expect(await events(page, "editingModeChanged")).toEqual([]);
  });

  test("the keyboard does not change the table", async ({ page }) => {
    await page.locator("#before").focus();
    await page.keyboard.press("Tab");
    for (const key of ["Enter", "Space", "7", "Delete", "Delete", "ArrowDown"]) {
      await page.keyboard.press(key);
    }
    await expect(rows(page)).toHaveCount(3);
    await expect(page.locator(".editable-table input:visible")).toHaveCount(0);
    await expect(cellText(page, 0, EMAIL)).toHaveText("george.bluth@example.com");
    expect(await events(page, "editingModeChanged")).toEqual([]);
  });
});

test.describe("height", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, { rows: "many", height: "250px" });
  });

  test("the table has the specified height and can be scrolled", async ({ page }) => {
    const size = await table(page).evaluate(element => ({
      height: element.getBoundingClientRect().height,
      scrollable: element.scrollHeight > element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
    }));
    expect(size).toEqual({ height: 250, scrollable: true, overflowY: "auto" });
    await expect(rows(page)).toHaveCount(20);
  });

  test("the focused cell is scrolled into the view", async ({ page }) => {
    await focusCell(page, 0, PHONE);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("ArrowDown");
    }
    await expectViewing(page, 12, PHONE);
    const tableBox = await table(page).boundingBox();
    const cellBox = await cell(page, 12, PHONE).boundingBox();
    expect(cellBox.y).toBeGreaterThanOrEqual(tableBox.y);
    expect(cellBox.y + cellBox.height).toBeLessThanOrEqual(tableBox.y + tableBox.height);
    expect(await table(page).evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  });
});

test.describe("autoAddRow", () => {
  test("Arrow down in the last row adds the new row", async ({ page }) => {
    await open(page);
    await focusCell(page, 2, PHONE);
    await page.keyboard.press("ArrowDown");
    await expect(rows(page)).toHaveCount(4);
    await expectViewing(page, 3, PHONE);
    expect(await rowTexts(page, 3)).toEqual(["", "", "", "", ""]);
  });

  test("Tab in the last cell of the last row adds the new row", async ({ page }) => {
    await open(page);
    await startEdit(page, 2, SALARY);
    await fill(page, 2, SALARY, "1300");
    await page.keyboard.press("Tab");
    await expect(rows(page)).toHaveCount(4);
    await expectEditing(page, 3, EMAIL);
  });

  test("the new row is not added when the last row is empty", async ({ page }) => {
    await open(page);
    await focusCell(page, 2, PHONE);
    await page.keyboard.press("ArrowDown");
    await expectViewing(page, 3, PHONE);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(rows(page)).toHaveCount(4);
    await expectViewing(page, 3, PHONE);
  });

  test("the new row can be filled", async ({ page }) => {
    await open(page);
    await focusCell(page, 2, PHONE);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.type("5550199");
    await page.keyboard.press("Enter");
    await expect(cellText(page, 3, PHONE)).toHaveText("5550199");
    const updated = await lastEvent(page, "update");
    expect(updated).toHaveLength(4);
    expect(updated[3]).toEqual({ email: "", name: "", department: "", phone: "5550199", salary: "" });
  });

  test("the new row is not added when disabled", async ({ page }) => {
    await open(page, { autoAddRow: false });
    await focusCell(page, 2, PHONE);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(rows(page)).toHaveCount(3);
    await expectViewing(page, 2, PHONE);
    await page.keyboard.press("ArrowUp");
    await expectViewing(page, 1, PHONE);
  });

  test("Tab in the last cell of the last row does not add the new row when disabled", async ({ page }) => {
    await open(page, { autoAddRow: false });
    await startEdit(page, 2, SALARY);
    await fill(page, 2, SALARY, "1300");
    await page.keyboard.press("Tab");
    await expect(cellText(page, 2, SALARY)).toHaveText("$1300");
    await expect(rows(page)).toHaveCount(3);
    await expectFocusedInLastCell(page);
  });
});

async function expectFocusedInLastCell(page) {
  await expect(focusedCell(page)).toHaveCount(1);
  await expect(cell(page, 2, SALARY)).toHaveClass(/editable-table-cell-focused/);
}

test.describe("noSoundOnError", () => {
  const makeError = async (page) => {
    await startEdit(page, 0, SALARY);
    await fill(page, 0, SALARY, "12.5");
    await page.keyboard.press("Enter");
    await expect.poll(() => events(page, "validationError")).toHaveLength(1);
  };

  test("the sound is played on the validation error", async ({ page }) => {
    await open(page);
    await makeError(page);
    expect(await sounds(page)).toBe(1);
  });

  test("the sound is not played when disabled", async ({ page }) => {
    await open(page, { noSoundOnError: true });
    await makeError(page);
    expect(await sounds(page)).toBe(0);
  });
});

test.describe("events", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("update is triggered with all rows when the data of a row is updated", async ({ page }) => {
    await startEdit(page, 1, PHONE);
    await fill(page, 1, PHONE, "555-9999");
    await clearEvents(page);
    await page.keyboard.press("Enter");
    await expect(cellText(page, 1, PHONE)).toHaveText("555-9999");
    const updated = await lastEvent(page, "update");
    expect(updated).toHaveLength(3);
    expect(updated.map(row => row.phone)).toEqual(["555-0101", "555-9999", "555-0103"]);
    expect(updated[1]).toEqual({
      email: expect.objectContaining({ value: "janet.weaver@example.com" }),
      name: { name: "Janet Weaver", id: 2 },
      department: { value: 3, title: "Finance", subtitle: "Accounting and finance" },
      phone: "555-9999",
      salary: 1200,
    });
  });

  test("update is triggered when the row is removed", async ({ page }) => {
    await focusCell(page, 0, PHONE);
    await clearEvents(page);
    await page.keyboard.press("Delete");
    await page.keyboard.press("Delete");
    await expect(rows(page)).toHaveCount(2);
    const updated = await lastEvent(page, "update");
    expect(updated.map(row => row.phone)).toEqual(["555-0102", "555-0103"]);
  });

  test("update is not triggered when editing is cancelled", async ({ page }) => {
    await startEdit(page, 1, PHONE);
    await fill(page, 1, PHONE, "555-9999");
    await clearEvents(page);
    await page.keyboard.press("Escape");
    await expectViewing(page, 1, PHONE);
    expect(await events(page, "update")).toEqual([]);
  });

  test("editingModeChanged is triggered when the cell is switched to editing mode and back", async ({ page }) => {
    await startEdit(page, 0, PHONE);
    expect(await events(page, "editingModeChanged")).toEqual([true]);
    await page.keyboard.press("Enter");
    await expectViewing(page, 0, PHONE);
    expect(await events(page, "editingModeChanged")).toEqual([true, false]);
    await page.keyboard.press("Enter");
    await expectEditing(page, 0, PHONE);
    await page.keyboard.press("Escape");
    await expectViewing(page, 0, PHONE);
    expect(await events(page, "editingModeChanged")).toEqual([true, false, true, false]);
  });

  test("validationError is triggered with the details of the error", async ({ page }) => {
    await startEdit(page, 1, SALARY);
    await fill(page, 1, SALARY, "12.5");
    await page.keyboard.press("Enter");
    await expect.poll(() => events(page, "validationError")).toEqual([
      { rowIndex: 1, columnKey: "salary", value: "12.5", message: "Invalid number" },
    ]);
    // The cell stays in editing mode with the declined value, the previous value is kept
    await expectEditing(page, 1, SALARY);
    await expect(input(page, 1, SALARY)).toHaveValue("12.5");
    await page.keyboard.press("Escape");
    await expect(cellText(page, 1, SALARY)).toHaveText("$1200");
  });

  test("validationError is triggered for the required value", async ({ page }) => {
    await startEdit(page, 1, DEPARTMENT);
    await fill(page, 1, DEPARTMENT, "");
    // The list is opened when the input is cleared: Esc closes the list, Enter saves the value
    await page.keyboard.press("Escape");
    await page.keyboard.press("Enter");
    await expect.poll(() => events(page, "validationError")).toEqual([
      { rowIndex: 1, columnKey: "department", value: "", message: "Value is required" },
    ]);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(cellText(page, 1, DEPARTMENT)).toHaveText("Finance (Accounting and finance)");
  });
});
