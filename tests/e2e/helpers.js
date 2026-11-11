import { expect, test as base } from "@playwright/test";

// Every test fails if the page reports an error
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    await use(page);
    expect(errors, "errors of the page").toEqual([]);
  },
});

export { expect };

// Indexes of the columns of the test application
export const EMAIL = 0;
export const NAME = 1;
export const DEPARTMENT = 2;
export const PHONE = 3;
export const SALARY = 4;

// Opens the test application, see tests/e2e/app/App.vue for the parameters
export async function open(page, params = {}) {
  // Count the sounds of validation errors instead of playing them
  await page.addInitScript(() => {
    window.__sounds = 0;
    window.Audio = class {
      play() {
        window.__sounds++;
      }
    };
  });
  await page.goto(`/?${new URLSearchParams(params)}`);
  await expect(table(page)).toBeVisible();
}

// --- locators

export const table = (page) => page.locator(".editable-table");
export const header = (page) => page.locator(".editable-table-header");
export const headerCells = (page) => header(page).locator("> .v-col");
export const rows = (page) => page.locator(".editable-table-row");
export const cell = (page, rowIndex, columnIndex) => rows(page).nth(rowIndex).locator(".editable-table-cell").nth(columnIndex);
export const cellText = (page, rowIndex, columnIndex) => cell(page, rowIndex, columnIndex).locator("> span");
// Vuetify 4 adds the hidden input with the value to the combobox
export const input = (page, rowIndex, columnIndex) => cell(page, rowIndex, columnIndex).locator("input:not([type=hidden])");
export const focusedCell = (page) => page.locator(".editable-table-cell-focused");
export const list = (page) => page.locator(".v-overlay--active .v-list");
export const listItems = (page) => page.locator(".v-overlay--active .v-list-item");
export const listTitles = (page) => page.locator(".v-overlay--active .v-list-item-title");

// --- state

export const rowTexts = (page, rowIndex) => rows(page).nth(rowIndex).locator(".editable-table-cell > span").allTextContents();

// Events of the component logged by the test application
export const events = (page, name) => page.evaluate(
  (name) => window.__events.filter(e => !name || e.name === name).map(e => name ? e.payload : e), name);
export const lastEvent = async (page, name) => (await events(page, name)).at(-1);
export const clearEvents = (page) => page.evaluate(() => { window.__events.length = 0; });
export const sounds = (page) => page.evaluate(() => window.__sounds);
export const searches = (page) => page.evaluate(() => window.__searches);

// --- expectations

export async function expectFocused(page, rowIndex, columnIndex) {
  await expect(focusedCell(page)).toHaveCount(1);
  await expect(cell(page, rowIndex, columnIndex)).toHaveClass(/editable-table-cell-focused/);
}

// The cell is focused and is not edited, the keyboard is handled by the cell
export async function expectViewing(page, rowIndex, columnIndex) {
  await expectFocused(page, rowIndex, columnIndex);
  await expect(input(page, rowIndex, columnIndex)).toBeHidden();
  await expect(cell(page, rowIndex, columnIndex)).toBeFocused();
}

// The cell is edited, the keyboard is handled by the input of the cell
export async function expectEditing(page, rowIndex, columnIndex) {
  await expectFocused(page, rowIndex, columnIndex);
  await expect(input(page, rowIndex, columnIndex)).toBeVisible();
  await expect(input(page, rowIndex, columnIndex)).toBeFocused();
}

export async function expectNoList(page) {
  await expect(listItems(page)).toHaveCount(0);
}

// --- actions

// Switch the cell to editing mode by click
export async function startEdit(page, rowIndex, columnIndex) {
  await cell(page, rowIndex, columnIndex).click();
  await expectEditing(page, rowIndex, columnIndex);
}

// Focus the cell without switching to editing mode
export async function focusCell(page, rowIndex, columnIndex) {
  await startEdit(page, rowIndex, columnIndex);
  await page.keyboard.press("Escape");
  await expectViewing(page, rowIndex, columnIndex);
}

// Replace the text of the edited cell
export async function fill(page, rowIndex, columnIndex, text) {
  await input(page, rowIndex, columnIndex).fill(text);
}
