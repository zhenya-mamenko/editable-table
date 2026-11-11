import {
  DEPARTMENT, EMAIL, PHONE, SALARY, cell, cellText, expect, expectEditing, expectNoList, expectViewing, fill, focusCell,
  input, listItems, open, rows, rowTexts, startEdit, test,
} from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await open(page);
});

test.describe("focus", () => {
  test("the first editable cell is focused when the table gets the focus", async ({ page }) => {
    await page.locator("#before").focus();
    await page.keyboard.press("Tab");
    await expectViewing(page, 0, EMAIL);
  });

  test("click on the cell switches it to editing mode", async ({ page }) => {
    await cell(page, 1, PHONE).click();
    await expectEditing(page, 1, PHONE);
    await expect(input(page, 1, PHONE)).toHaveValue("555-0102");
  });

  test("the focused cell is remembered when the focus returns to the table", async ({ page }) => {
    await focusCell(page, 1, PHONE);
    await page.locator("#before").focus();
    await page.keyboard.press("Tab");
    await expectViewing(page, 1, PHONE);
  });
});

test.describe("keyboard in non-editing mode", () => {
  test("Arrow up moves to the previous row", async ({ page }) => {
    await focusCell(page, 1, PHONE);
    await page.keyboard.press("ArrowUp");
    await expectViewing(page, 0, PHONE);
    await page.keyboard.press("ArrowUp");
    await expectViewing(page, 0, PHONE);
  });

  test("Arrow down moves to the next row", async ({ page }) => {
    await focusCell(page, 0, PHONE);
    await page.keyboard.press("ArrowDown");
    await expectViewing(page, 1, PHONE);
    await page.keyboard.press("ArrowDown");
    await expectViewing(page, 2, PHONE);
  });

  test("Arrow left moves to the previous cell", async ({ page }) => {
    await focusCell(page, 1, SALARY);
    await page.keyboard.press("ArrowLeft");
    await expectViewing(page, 1, PHONE);
    await page.keyboard.press("ArrowLeft");
    await expectViewing(page, 1, DEPARTMENT);
  });

  test("Arrow right moves to the next cell", async ({ page }) => {
    await focusCell(page, 1, DEPARTMENT);
    await page.keyboard.press("ArrowRight");
    await expectViewing(page, 1, PHONE);
    await page.keyboard.press("ArrowRight");
    await expectViewing(page, 1, SALARY);
  });

  test("arrows skip non-editable cells", async ({ page }) => {
    await focusCell(page, 1, DEPARTMENT);
    await page.keyboard.press("ArrowLeft");
    await expectViewing(page, 1, EMAIL);
    await page.keyboard.press("ArrowRight");
    await expectViewing(page, 1, DEPARTMENT);
  });

  test("Arrow right and Arrow left move between rows at the edges of the row", async ({ page }) => {
    await focusCell(page, 0, SALARY);
    await page.keyboard.press("ArrowRight");
    await expectViewing(page, 1, EMAIL);
    await page.keyboard.press("ArrowLeft");
    await expectViewing(page, 0, SALARY);
  });

  test("Enter enters to editing mode", async ({ page }) => {
    await focusCell(page, 0, PHONE);
    await page.keyboard.press("Enter");
    await expectEditing(page, 0, PHONE);
    await expect(input(page, 0, PHONE)).toHaveValue("555-0101");
  });

  test("Space enters to editing mode", async ({ page }) => {
    await focusCell(page, 0, PHONE);
    await page.keyboard.press("Space");
    await expectEditing(page, 0, PHONE);
    await expect(input(page, 0, PHONE)).toHaveValue("555-0101");
  });

  test("typing of a letter or a digit starts editing with the typed text", async ({ page }) => {
    await focusCell(page, 0, PHONE);
    await page.keyboard.type("712");
    await expectEditing(page, 0, PHONE);
    await expect(input(page, 0, PHONE)).toHaveValue("712");
    await page.keyboard.press("Enter");
    await expect(cellText(page, 0, PHONE)).toHaveText("712");
  });

  test("Del pressed twice removes the row", async ({ page }) => {
    await focusCell(page, 1, PHONE);
    await page.keyboard.press("Delete");
    await expect(rows(page)).toHaveCount(3);
    await page.keyboard.press("Delete");
    await expect(rows(page)).toHaveCount(2);
    await expect(cellText(page, 0, EMAIL)).toHaveText("george.bluth@example.com");
    await expect(cellText(page, 1, EMAIL)).toHaveText("emma.wong@example.com");
    await expectViewing(page, 1, PHONE);
  });

  test("Del pressed once does not remove the row", async ({ page }) => {
    await focusCell(page, 1, PHONE);
    await page.keyboard.press("Delete");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Delete");
    await expectViewing(page, 0, PHONE);
    await expect(rows(page)).toHaveCount(3);
  });

  test("removing of all rows leaves the empty row", async ({ page }) => {
    await focusCell(page, 0, PHONE);
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Delete");
      await page.keyboard.press("Delete");
    }
    await expect(rows(page)).toHaveCount(1);
    expect(await rowTexts(page, 0)).toEqual(["", "", "", "", ""]);
    await expectViewing(page, 0, PHONE);
  });
});

test.describe("keyboard in editing mode", () => {
  test("Arrow down opens the dropdown list", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await expectNoList(page);
    await page.keyboard.press("ArrowDown");
    await expect(listItems(page)).toHaveCount(6);
    await expectFocusedCellIsStillEdited(page, 0, DEPARTMENT);
  });

  test("Tab saves the value and moves to the next cell", async ({ page }) => {
    await startEdit(page, 0, PHONE);
    await fill(page, 0, PHONE, "555-9999");
    await page.keyboard.press("Tab");
    await expect(cellText(page, 0, PHONE)).toHaveText("555-9999");
    await expectEditing(page, 0, SALARY);
  });

  test("Shift+Tab saves the value and moves to the previous cell", async ({ page }) => {
    await startEdit(page, 0, PHONE);
    await fill(page, 0, PHONE, "555-9999");
    await page.keyboard.press("Shift+Tab");
    await expect(cellText(page, 0, PHONE)).toHaveText("555-9999");
    await expectEditing(page, 0, DEPARTMENT);
  });

  test("Tab and Shift+Tab skip non-editable cells", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await page.keyboard.press("Shift+Tab");
    await expectEditing(page, 0, EMAIL);
    await expect(cellText(page, 0, DEPARTMENT)).toHaveText("IT (Information technology and something more just for text)");
  });

  test("Tab in the last cell of the row moves to the first cell of the next row", async ({ page }) => {
    await startEdit(page, 0, SALARY);
    await fill(page, 0, SALARY, "1300");
    await page.keyboard.press("Tab");
    await expect(cellText(page, 0, SALARY)).toHaveText("$1300");
    await expectEditing(page, 1, EMAIL);
  });

  test("Enter saves the value and exits from editing mode", async ({ page }) => {
    await startEdit(page, 0, PHONE);
    await fill(page, 0, PHONE, "555-9999");
    await page.keyboard.press("Enter");
    await expect(cellText(page, 0, PHONE)).toHaveText("555-9999");
    await expectViewing(page, 0, PHONE);
  });

  test("Esc exits from editing mode without saving the value", async ({ page }) => {
    await startEdit(page, 0, PHONE);
    await fill(page, 0, PHONE, "555-9999");
    await page.keyboard.press("Escape");
    await expectViewing(page, 0, PHONE);
    await expect(cellText(page, 0, PHONE)).toHaveText("555-0101");
  });

  test("Esc closes the opened list first", async ({ page }) => {
    await startEdit(page, 0, DEPARTMENT);
    await fill(page, 0, DEPARTMENT, "fin");
    await expect(listItems(page)).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expectNoList(page);
    await expectEditing(page, 0, DEPARTMENT);
    await page.keyboard.press("Escape");
    await expectViewing(page, 0, DEPARTMENT);
    await expect(cellText(page, 0, DEPARTMENT)).toHaveText("IT (Information technology and something more just for text)");
  });

  test("click outside of the table saves the value", async ({ page }) => {
    await startEdit(page, 0, PHONE);
    await fill(page, 0, PHONE, "555-9999");
    await page.locator("#after").click();
    await expect(cellText(page, 0, PHONE)).toHaveText("555-9999");
    await expect(input(page, 0, PHONE)).toBeHidden();
  });
});

async function expectFocusedCellIsStillEdited(page, rowIndex, columnIndex) {
  await expect(cell(page, rowIndex, columnIndex)).toHaveClass(/editable-table-cell-focused/);
  await expect(input(page, rowIndex, columnIndex)).toBeVisible();
}
