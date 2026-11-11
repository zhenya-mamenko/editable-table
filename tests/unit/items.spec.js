import { describe, expect, it, vi } from "vitest";
import { VCombobox } from "vuetify/components/VCombobox";
import {
  cellComponent, cellOf, cellText, departments, edit, flush, inputOf, isEditing, lastEmitted, mountTable, press,
  startEdit, typeText,
} from "./helpers.js";

const noMove = { col: 0, row: 0, edit: false };

const mountWithItems = async (items, extra = {}, value = "") => {
  const wrapper = mountTable({
    columns: [{ key: "value", label: "Value", editable: true, items, ...extra }, { key: "other", label: "Other", editable: true }],
    rows: [{ value, other: "" }],
    noSoundOnError: true,
  });
  await flush();
  return wrapper;
};

// Items passed to the combobox of the cell
const comboboxItems = (wrapper, rowIndex = 0, columnIndex = 0) =>
  cellOf(wrapper, rowIndex, columnIndex).findComponent(VCombobox).props("items");

// Titles of the items filtered by the combobox
const filteredTitles = (wrapper, rowIndex = 0, columnIndex = 0) =>
  cellOf(wrapper, rowIndex, columnIndex).findComponent(VCombobox).vm.filteredItems.map(i => i.title);

describe("items", () => {
  describe("array of strings", () => {
    it("is used as the list of the cell", async () => {
      const wrapper = await mountWithItems(["Red", "Green", "Blue"]);
      expect(comboboxItems(wrapper)).toEqual(["Red", "Green", "Blue"]);
    });

    it("allows to enter the value out of the list", async () => {
      const wrapper = await mountWithItems(["Red", "Green", "Blue"]);
      await edit(wrapper, 0, 0, "Yellow", "Enter");
      expect(cellText(wrapper, 0, 0)).toBe("Yellow");
      expect(lastEmitted(wrapper, "update")).toEqual([{ value: "Yellow", other: "" }]);
    });
  });

  describe("values", () => {
    it("can be the array of strings", async () => {
      const wrapper = await mountWithItems({ values: ["Red", "Green", "Blue"] });
      expect(comboboxItems(wrapper)).toEqual(["Red", "Green", "Blue"]);
    });

    it("can be the array of numbers", async () => {
      const wrapper = await mountWithItems({ values: [1000, 1200, 1500] });
      expect(comboboxItems(wrapper)).toEqual([1000, 1200, 1500]);
    });

    it("can be the array of objects with title, value and subtitle", async () => {
      const wrapper = await mountWithItems({ values: departments });
      expect(comboboxItems(wrapper)).toEqual([
        { title: "HR", value: 1, props: { subtitle: "Human resources" } },
        { title: "IT", value: 2, props: { subtitle: "Information technology" } },
        { title: "Finance", value: 3, props: { subtitle: "Accounting and finance" } },
      ]);
    });

    it("uses the title as the value of the object without the value", async () => {
      const wrapper = await mountWithItems({ values: [{ title: "First", value: 1 }, { title: "Second" }] });
      expect(comboboxItems(wrapper)).toEqual([{ title: "First", value: 1 }, { title: "Second", value: "Second" }]);
    });

    it("is copied, the changes of the passed values do not affect the list", async () => {
      const values = [{ title: "First", value: 1 }];
      const wrapper = await mountWithItems({ values });
      values.push({ title: "Second", value: 2 });
      values[0].title = "Changed";
      await flush();
      expect(comboboxItems(wrapper)).toEqual([{ title: "First", value: 1 }]);
    });

    it("is reloaded when the columns are changed", async () => {
      const wrapper = await mountWithItems(["Red"]);
      await wrapper.setProps({ columns: [{ key: "value", label: "Value", editable: true, items: ["Green", "Blue"] }] });
      await flush();
      expect(comboboxItems(wrapper)).toEqual(["Green", "Blue"]);
    });

    it("has no list without the items", async () => {
      const wrapper = await mountWithItems(undefined);
      expect(comboboxItems(wrapper)).toEqual([]);
    });
  });

  describe("exact", () => {
    it("is false by default: the value out of the list is accepted", async () => {
      const wrapper = await mountWithItems({ values: ["Red", "Green", "Blue"] });
      await edit(wrapper, 0, 0, "Yellow", "Enter");
      expect(cellText(wrapper, 0, 0)).toBe("Yellow");
    });

    it("declines the value out of the list", async () => {
      const wrapper = await mountWithItems({ values: ["Red", "Green", "Blue"], exact: true }, {}, "Red");
      const cell = await edit(wrapper, 0, 0, "Yellow", "Enter");
      expect(isEditing(cell)).toBe(false);
      expect(cellText(wrapper, 0, 0)).toBe("Red");
      expect(wrapper.emitted("update")).toBeUndefined();
      expect(wrapper.emitted("validationError")).toBeUndefined();
    });

    it("accepts the value from the list", async () => {
      const wrapper = await mountWithItems({ values: ["Red", "Green", "Blue"], exact: true }, {}, "Red");
      wrapper.vm.updateCell(0, "value", "Green", noMove);
      await flush();
      expect(cellText(wrapper, 0, 0)).toBe("Green");
    });

    it("accepts the empty value", async () => {
      const wrapper = await mountWithItems({ values: ["Red", "Green", "Blue"], exact: true }, {}, "Red");
      // The list is opened when the input is cleared: Esc closes the list, Enter saves the value
      const cell = await edit(wrapper, 0, 0, "", "Escape");
      expect(isEditing(cell)).toBe(true);
      await press(inputOf(cell), "Enter");
      expect(isEditing(cell)).toBe(false);
      expect(cellText(wrapper, 0, 0)).toBe("");
      expect(lastEmitted(wrapper, "update")).toEqual([{ value: "", other: "" }]);
    });

    it("is not applied when the list is empty", async () => {
      const wrapper = await mountWithItems({ values: [], exact: true });
      await edit(wrapper, 0, 0, "Yellow", "Enter");
      expect(cellText(wrapper, 0, 0)).toBe("Yellow");
    });

    it("saves the selected object of the list as the value of the cell", async () => {
      const wrapper = await mountWithItems({ values: departments, exact: true }, { format: "{title} ({subtitle}) #{value}" });
      const cell = await startEdit(wrapper, 0, 0);
      await typeText(cell, "fin");
      await press(inputOf(cell), "Enter");
      await press(inputOf(cell), "Enter");
      expect(isEditing(cell)).toBe(false);
      expect(cellText(wrapper, 0, 0)).toBe("Finance (Accounting and finance) #3");
      expect(lastEmitted(wrapper, "update")).toEqual([{ value: departments[2], other: "" }]);
    });

    it("declines the text which is not the title of an object of the list", async () => {
      const wrapper = await mountWithItems({ values: departments, exact: true }, {}, departments[0]);
      const cell = await edit(wrapper, 0, 0, "Unknown", "Enter");
      expect(isEditing(cell)).toBe(false);
      expect(cellText(wrapper, 0, 0)).toBe("HR");
      expect(wrapper.emitted("update")).toBeUndefined();
    });
  });

  describe("filterSubtitle", () => {
    it("filters the list by the title and the subtitle by default", async () => {
      const wrapper = await mountWithItems({ values: departments });
      const cell = await startEdit(wrapper, 0, 0);
      expect(cellComponent(wrapper, 0, 0).vm.filterKeys).toEqual(["title", "props.subtitle"]);
      await typeText(cell, "technology");
      expect(filteredTitles(wrapper)).toEqual(["IT"]);
      await typeText(cell, "fin");
      expect(filteredTitles(wrapper)).toEqual(["Finance"]);
    });

    it("filters the list only by the title when disabled", async () => {
      const wrapper = await mountWithItems({ values: departments, filterSubtitle: false });
      const cell = await startEdit(wrapper, 0, 0);
      expect(cellComponent(wrapper, 0, 0).vm.filterKeys).toEqual(["title"]);
      await typeText(cell, "technology");
      expect(filteredTitles(wrapper)).toEqual([]);
      await typeText(cell, "fin");
      expect(filteredTitles(wrapper)).toEqual(["Finance"]);
    });

    it("filters the list only by the title when there are no subtitles", async () => {
      const wrapper = await mountWithItems({ values: [{ title: "First", value: 1 }, { title: "Second", value: 2 }] });
      await startEdit(wrapper, 0, 0);
      expect(cellComponent(wrapper, 0, 0).vm.filterKeys).toEqual(["title"]);
    });
  });

  describe("search", () => {
    const users = [
      { value: "george@example.com", title: "george@example.com", subtitle: "George Bluth" },
      { value: "emma@example.com", title: "emma@example.com", subtitle: "Emma Wong" },
    ];

    it("is called with the typed text", async () => {
      const search = vi.fn(() => []);
      const wrapper = await mountWithItems({ values: [], search });
      const cell = await startEdit(wrapper, 0, 0);
      await typeText(cell, "geo");
      expect(search).toHaveBeenCalledWith("geo");
    });

    it("returns the new values of the list", async () => {
      const search = value => users.filter(u => u.title.includes(value));
      const wrapper = await mountWithItems({ values: [], search });
      const cell = await startEdit(wrapper, 0, 0);
      await typeText(cell, "geo");
      expect(comboboxItems(wrapper)).toEqual([
        { title: "george@example.com", value: "george@example.com", props: { subtitle: "George Bluth" } },
      ]);
      await typeText(cell, "e");
      expect(comboboxItems(wrapper)).toHaveLength(2);
    });

    it("can return the promise", async () => {
      let resolve;
      const search = vi.fn(() => new Promise(r => { resolve = r; }));
      const wrapper = await mountWithItems({ values: [], search });
      const cell = await startEdit(wrapper, 0, 0);
      await typeText(cell, "emma");
      expect(cellComponent(wrapper, 0, 0).vm.loading).toBe(true);
      expect(comboboxItems(wrapper)).toEqual([]);
      resolve([users[1]]);
      await flush();
      expect(cellComponent(wrapper, 0, 0).vm.loading).toBe(false);
      expect(comboboxItems(wrapper)).toEqual([
        { title: "emma@example.com", value: "emma@example.com", props: { subtitle: "Emma Wong" } },
      ]);
    });

    it("clears the list when returns nothing", async () => {
      const search = value => value === "geo" ? [users[0]] : undefined;
      const wrapper = await mountWithItems({ values: [], search });
      const cell = await startEdit(wrapper, 0, 0);
      await typeText(cell, "geo");
      expect(comboboxItems(wrapper)).toHaveLength(1);
      await typeText(cell, "geox");
      expect(comboboxItems(wrapper)).toEqual([]);
    });

    it("saves the found object selected from the list", async () => {
      const search = value => users.filter(u => u.title.includes(value));
      const wrapper = await mountWithItems({ values: [], exact: true, search }, { format: "{title} / {subtitle}" });
      const cell = await startEdit(wrapper, 0, 0);
      await typeText(cell, "emma");
      wrapper.vm.updateCell(0, "value", users[1], noMove);
      await flush();
      expect(cellText(wrapper, 0, 0)).toBe("emma@example.com / Emma Wong");
      expect(lastEmitted(wrapper, "update")).toEqual([{ value: users[1], other: "" }]);
      expect(isEditing(cell)).toBeTypeOf("boolean");
    });
  });
});
