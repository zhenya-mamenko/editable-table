import { flushPromises, mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createVuetify } from "vuetify";
import EditableTable from "../../src/index.js";

export const departments = [
  { value: 1, title: "HR", subtitle: "Human resources" },
  { value: 2, title: "IT", subtitle: "Information technology" },
  { value: 3, title: "Finance", subtitle: "Accounting and finance" },
];

// The same structure as in the example
export const exampleColumns = () => [
  { key: "email", label: "Email", type: "email", editable: true, width: 3 },
  { key: "name", label: "Name", type: "text", editable: false, width: 3, class: "bg-grey-lighten-5" },
  { key: "department", label: "Department", type: "text", editable: true, width: 3, validation: "required",
    items: { values: departments, exact: true },
    format: "{title} ({subtitle})",
  },
  { key: "phone", label: "Phone", type: "tel", editable: true, width: 2 },
  { key: "salary", label: "Salary", type: "number", editable: true, validation: "int", format: "${0}",
    items: { values: [1000, 1200, 1500], exact: false },
  },
];

export const exampleRows = () => [
  { email: "john@example.com", name: "John Doe", department: departments[1], phone: "555-0101", salary: 1000 },
  { email: "jane@example.com", name: "Jane Roe", department: departments[2], phone: "555-0102", salary: 1500 },
];

// Errors thrown by the handlers and hooks of components, checked after every test
export const errors = [];

export function mountTable(props = {}, options = {}) {
  return mount(EditableTable, {
    attachTo: document.body,
    props: {
      columns: exampleColumns(),
      rows: exampleRows(),
      ...props,
    },
    global: {
      plugins: [createVuetify()],
      config: {
        errorHandler: (error) => errors.push(error),
      },
    },
    ...options,
  });
}

// --- queries

export const headerOf = (wrapper) => wrapper.find(".editable-table-header");
export const rowsOf = (wrapper) => wrapper.findAll(".editable-table-row");
export const cellsOf = (wrapper, rowIndex) => rowsOf(wrapper)[rowIndex].findAll(".editable-table-cell");
export const cellOf = (wrapper, rowIndex, columnIndex) => cellsOf(wrapper, rowIndex)[columnIndex];
export const cellText = (wrapper, rowIndex, columnIndex) => cellOf(wrapper, rowIndex, columnIndex).find("span").text();
export const rowTexts = (wrapper, rowIndex) => cellsOf(wrapper, rowIndex).map(c => c.find("span").text());
export const cellComponent = (wrapper, rowIndex, columnIndex) =>
  rowsOf(wrapper)[rowIndex].findAllComponents({ name: "EditableTableCell" })[columnIndex];
export const lastEmitted = (wrapper, event) => wrapper.emitted(event)?.at(-1)?.[0];

export const isEditing = (cell) => !cell.find(".editable-table-cell-content").classes().includes("d-none");
export const isFocused = (cell) => cell.classes().includes("editable-table-cell-focused");
// Vuetify 4 adds the hidden input with the value to the combobox
export const inputOf = (cell) => cell.find("input:not([type=hidden])");

// Position of the focused cell as [rowIndex, columnIndex], null if there is no focused cell
export const focusedPosition = (wrapper) => {
  const result = [];
  rowsOf(wrapper).forEach((row, rowIndex) => {
    row.findAll(".editable-table-cell").forEach((cell, columnIndex) => {
      if (isFocused(cell)) result.push([rowIndex, columnIndex]);
    });
  });
  if (result.length === 0) return null;
  return result.length === 1 ? result[0] : result;
};

// --- interaction

export const flush = async () => {
  await flushPromises();
  await nextTick();
  await flushPromises();
};

export const press = async (element, key, options = {}) => {
  await element.trigger("keydown", { key, ...options });
  await flush();
};

// Give the focus to the table, as it happens on Tab key or click
export const focusTable = async (wrapper) => {
  await wrapper.trigger("focus");
  await flush();
};

// Press the key on the focused cell (non-editing mode)
export const pressOnFocused = async (wrapper, key, options = {}) => {
  await press(wrapper.find(".editable-table-cell-focused"), key, options);
};

// Switch the cell to editing mode by click
export const startEdit = async (wrapper, rowIndex, columnIndex) => {
  const cell = cellOf(wrapper, rowIndex, columnIndex);
  await cell.trigger("click");
  await flush();
  return cell;
};

// Type the text to the input of the cell in editing mode
export const typeText = async (cell, text) => {
  await inputOf(cell).setValue(text);
  await flush();
};

// Edit the cell: click, type the text and press the key
export const edit = async (wrapper, rowIndex, columnIndex, text, key = "Enter", options = {}) => {
  const cell = await startEdit(wrapper, rowIndex, columnIndex);
  await typeText(cell, text);
  await press(inputOf(cell), key, options);
  return cell;
};
