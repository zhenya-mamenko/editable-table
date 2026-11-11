import {
  DEPARTMENT, EMAIL, NAME, PHONE, SALARY, cell, events, expect, fill, focusCell, header, headerCells, input, open, rows,
  startEdit, table, test,
} from "./helpers.js";

const style = (locator, ...properties) => locator.evaluate(
  (element, properties) => Object.fromEntries(properties.map(p => [p, getComputedStyle(element).getPropertyValue(p)])),
  properties);

// Color of the theme of Vuetify as [red, green, blue]
const themeColor = async (page, name) => {
  const value = await table(page).evaluate(
    (element, name) => getComputedStyle(element).getPropertyValue(`--v-theme-${name}`), name);
  return value.split(",").map(Number);
};

// Parses the computed color to [red, green, blue, alpha], supports rgb(), rgba() and color(srgb ...)
const parseColor = (color) => {
  const numbers = color.match(/-?\d*\.?\d+(e-?\d+)?/g).map(Number);
  if (color.startsWith("color(srgb")) {
    const [red, green, blue, alpha = 1] = numbers;
    return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255), alpha];
  }
  const [red, green, blue, alpha = 1] = numbers;
  return [red, green, blue, alpha];
};

test.describe("default styles", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("the focused cell has the outline of the primary color", async ({ page }) => {
    await focusCell(page, 0, PHONE);
    const outline = await style(cell(page, 0, PHONE), "outline-style", "outline-width", "outline-offset", "outline-color");
    expect(outline).toMatchObject({ "outline-style": "solid", "outline-width": "2px", "outline-offset": "-2px" });
    expect(parseColor(outline["outline-color"])).toEqual([...await themeColor(page, "primary"), 1]);
  });

  test("the focused cell has the translucent outline when the table is not active", async ({ page }) => {
    await focusCell(page, 0, PHONE);
    await page.locator("#after").focus();
    await expect(table(page)).toHaveClass(/editable-table-non-active/);
    const outline = await style(cell(page, 0, PHONE), "outline-style", "outline-width", "outline-color");
    expect(outline).toMatchObject({ "outline-style": "solid", "outline-width": "2px" });
    const [red, green, blue, alpha] = parseColor(outline["outline-color"]);
    expect([red, green, blue]).toEqual(await themeColor(page, "primary"));
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(1);

    await page.locator("#before").focus();
    await page.keyboard.press("Tab");
    await expect(table(page)).not.toHaveClass(/editable-table-non-active/);
  });

  test("the cell with the validation error is marked with the outline of the error color", async ({ page }) => {
    // The mark is shown for a short time, so the styles are captured when the class is added
    await page.evaluate(() => {
      window.__errorOutline = null;
      new MutationObserver(() => {
        const element = document.querySelector(".editable-table-cell-error");
        if (element && !window.__errorOutline) {
          const computed = getComputedStyle(element);
          window.__errorOutline = [computed.outlineStyle, computed.outlineWidth, computed.outlineColor];
        }
      }).observe(document.querySelector(".editable-table"), { attributes: true, subtree: true, attributeFilter: ["class"] });
    });
    await startEdit(page, 0, SALARY);
    await fill(page, 0, SALARY, "12.5");
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => window.__errorOutline)).not.toBeNull();
    const [outlineStyle, outlineWidth, outlineColor] = await page.evaluate(() => window.__errorOutline);
    expect([outlineStyle, outlineWidth]).toEqual(["solid", "2px"]);
    expect(parseColor(outlineColor)).toEqual([...await themeColor(page, "error"), 1]);
    await expect(page.locator(".editable-table-cell-error")).toHaveCount(0);
    expect(await events(page, "validationError")).toHaveLength(1);
  });

  test("the header uses the colors of the theme", async ({ page }) => {
    const styles = await style(header(page), "background-color", "color", "font-weight", "text-align",
      "border-bottom-style", "border-bottom-width");
    expect(parseColor(styles["background-color"])).toEqual([...await themeColor(page, "surface-light"), 1]);
    expect(parseColor(styles.color)).toEqual([...await themeColor(page, "on-surface-light"), 1]);
    expect(styles).toMatchObject({
      "font-weight": "700",
      "text-align": "center",
      "border-bottom-style": "double",
      "border-bottom-width": "4px",
    });
  });

  test("the rows are separated with the border", async ({ page }) => {
    expect(await style(rows(page).nth(0), "border-bottom-style", "border-bottom-width")).toEqual({
      "border-bottom-style": "solid",
      "border-bottom-width": "1px",
    });
  });

  test("the class of the column is applied to the cells", async ({ page }) => {
    for (const rowIndex of [0, 1, 2]) {
      await expect(cell(page, rowIndex, NAME)).toHaveClass(/name-cell/);
      await expect(cell(page, rowIndex, NAME)).toHaveCSS("background-color", "rgb(250, 250, 250)");
    }
    await expect(cell(page, 0, EMAIL)).not.toHaveClass(/name-cell/);
  });

  test("numbers and phones are aligned to the right", async ({ page }) => {
    await expect(cell(page, 0, EMAIL)).toHaveCSS("text-align", "left");
    await expect(cell(page, 0, DEPARTMENT)).toHaveCSS("text-align", "left");
    await expect(cell(page, 0, PHONE)).toHaveCSS("text-align", "right");
    await expect(cell(page, 0, SALARY)).toHaveCSS("text-align", "right");
    await startEdit(page, 0, PHONE);
    await expect(input(page, 0, PHONE)).toHaveCSS("text-align", "right");
  });

  test("editable and non-editable cells have different cursors", async ({ page }) => {
    await expect(cell(page, 0, EMAIL)).toHaveCSS("cursor", "text");
    await expect(cell(page, 0, NAME)).toHaveCSS("cursor", "default");
  });
});

test.describe("layout", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("the widths of columns are set in the grid units", async ({ page }) => {
    const rowBox = await rows(page).nth(0).boundingBox();
    const widths = [3, 3, 3, 2, 1];
    for (const [index, width] of widths.entries()) {
      const box = await cell(page, 0, index).boundingBox();
      expect(Math.abs(box.width - rowBox.width * width / 12)).toBeLessThan(1);
    }
  });

  test("the cells are aligned with the header", async ({ page }) => {
    const headerBox = await header(page).boundingBox();
    const rowBox = await rows(page).nth(0).boundingBox();
    expect(rowBox.x).toBe(headerBox.x);
    expect(rowBox.width).toBe(headerBox.width);
    for (let index = 0; index < 5; index++) {
      const headerCell = await headerCells(page).nth(index).boundingBox();
      const rowCell = await cell(page, 0, index).boundingBox();
      expect(rowCell.x).toBe(headerCell.x);
      expect(rowCell.width).toBe(headerCell.width);
    }
  });

  test("the rows fill the table one after another", async ({ page }) => {
    const tableBox = await table(page).boundingBox();
    const headerBox = await header(page).boundingBox();
    const boxes = [];
    for (let index = 0; index < 3; index++) {
      boxes.push(await rows(page).nth(index).boundingBox());
    }
    // 48px of the cell and 1px of the border of the row
    expect(boxes.map(box => box.height)).toEqual([49, 49, 49]);
    expect(boxes[0].y).toBe(headerBox.y + headerBox.height);
    expect(boxes[1].y).toBe(boxes[0].y + 49);
    expect(boxes[2].y).toBe(boxes[1].y + 49);
    // The rows are inside of the table
    expect(headerBox.x).toBeGreaterThanOrEqual(tableBox.x);
    expect(headerBox.x + headerBox.width).toBeLessThanOrEqual(tableBox.x + tableBox.width);
    expect(boxes[2].y + boxes[2].height).toBeLessThanOrEqual(tableBox.y + tableBox.height);
  });

  test("the cells and the header have paddings", async ({ page }) => {
    await expect(cell(page, 0, PHONE)).toHaveCSS("padding", "12px");
    await expect(headerCells(page).nth(0)).toHaveCSS("padding", "12px");
  });

  test("the size of the cell is not changed in editing mode", async ({ page }) => {
    const before = await cell(page, 0, PHONE).boundingBox();
    await startEdit(page, 0, PHONE);
    expect(await cell(page, 0, PHONE).boundingBox()).toEqual(before);
    await startEditOfList(page);
    expect(await cell(page, 0, PHONE).boundingBox()).toEqual(before);
  });

  test("the message is shown instead of the table on small screens", async ({ page }) => {
    const message = page.getByText("Not enough space to show the table");
    await expect(message).toBeHidden();
    await page.setViewportSize({ width: 500, height: 800 });
    await expect(message).toBeVisible();
    await expect(header(page)).toBeHidden();
    await expect(rows(page).first()).toBeHidden();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(message).toBeHidden();
    await expect(rows(page).first()).toBeVisible();
  });
});

async function startEditOfList(page) {
  await page.keyboard.press("Escape");
  await startEdit(page, 0, DEPARTMENT);
}

test.describe("customization", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("the variables define the styles of the table", async ({ page }) => {
    await page.addStyleTag({ content: `
      .editable-table {
        --cell-focused-outline: 3px dashed rgb(255, 0, 0);
        --cell-focused-outline-non-active: 1px dotted rgb(0, 0, 255);
        --cell-focused-outline-offset: -3px;
        --header-background-color: rgb(0, 128, 0);
        --header-border: 2px solid rgb(1, 2, 3);
        --header-bottom-border: 3px solid rgb(4, 5, 6);
        --header-font-weight: 400;
        --header-text-align: left;
        --header-text-color: rgb(255, 255, 255);
        --row-border: 2px dashed rgb(7, 8, 9);
      }
    ` });

    expect(await style(header(page), "background-color", "color", "font-weight", "text-align",
      "border-bottom-style", "border-bottom-width", "border-bottom-color")).toEqual({
      "background-color": "rgb(0, 128, 0)",
      "color": "rgb(255, 255, 255)",
      "font-weight": "400",
      "text-align": "left",
      "border-bottom-style": "solid",
      "border-bottom-width": "3px",
      "border-bottom-color": "rgb(4, 5, 6)",
    });
    expect(await style(headerCells(page).nth(1), "border-right-width", "border-right-color", "border-top-width")).toEqual({
      "border-right-width": "2px",
      "border-right-color": "rgb(1, 2, 3)",
      "border-top-width": "2px",
    });
    expect(await style(rows(page).nth(0), "border-bottom-style", "border-bottom-width", "border-bottom-color")).toEqual({
      "border-bottom-style": "dashed",
      "border-bottom-width": "2px",
      "border-bottom-color": "rgb(7, 8, 9)",
    });
    expect(await style(cell(page, 0, PHONE), "border-right-style", "border-right-width")).toEqual({
      "border-right-style": "dashed",
      "border-right-width": "2px",
    });

    await focusCell(page, 0, PHONE);
    expect(await style(cell(page, 0, PHONE), "outline-style", "outline-width", "outline-color", "outline-offset")).toEqual({
      "outline-style": "dashed",
      "outline-width": "3px",
      "outline-color": "rgb(255, 0, 0)",
      "outline-offset": "-3px",
    });

    await page.locator("#after").focus();
    await expect(table(page)).toHaveClass(/editable-table-non-active/);
    expect(await style(cell(page, 0, PHONE), "outline-style", "outline-width", "outline-color")).toEqual({
      "outline-style": "dotted",
      "outline-width": "1px",
      "outline-color": "rgb(0, 0, 255)",
    });
  });

  test("the variable defines the outline of the cell with the validation error", async ({ page }) => {
    await page.addStyleTag({ content: ".editable-table { --cell-error-outline: 4px dotted rgb(255, 0, 255); }" });
    await page.evaluate(() => {
      window.__errorOutline = null;
      new MutationObserver(() => {
        const element = document.querySelector(".editable-table-cell-error");
        if (element && !window.__errorOutline) {
          const computed = getComputedStyle(element);
          window.__errorOutline = [computed.outlineStyle, computed.outlineWidth, computed.outlineColor];
        }
      }).observe(document.querySelector(".editable-table"), { attributes: true, subtree: true, attributeFilter: ["class"] });
    });
    await startEdit(page, 0, SALARY);
    await fill(page, 0, SALARY, "12.5");
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => window.__errorOutline)).toEqual(["dotted", "4px", "rgb(255, 0, 255)"]);
  });

  test("the classes of the header, rows and cells can be styled", async ({ page }) => {
    await page.addStyleTag({ content: `
      .editable-table-header { letter-spacing: 2px; }
      .editable-table-row { background-color: rgb(250, 250, 210); }
      .editable-table-cell { font-style: italic; }
    ` });
    await expect(header(page)).toHaveCSS("letter-spacing", "2px");
    await expect(rows(page).nth(1)).toHaveCSS("background-color", "rgb(250, 250, 210)");
    await expect(cell(page, 1, PHONE)).toHaveCSS("font-style", "italic");
  });
});
