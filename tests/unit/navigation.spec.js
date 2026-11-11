import { describe, expect, it, vi } from "vitest";
import {
  cellOf, cellText, exampleColumns, exampleRows, flush, focusedPosition, focusTable, inputOf, isEditing, lastEmitted,
  mountTable, press, pressOnFocused, rowsOf, rowTexts,
} from "./helpers.js";

// Focus the cell without switching to editing mode
const focusCell = async (wrapper, rowIndex, columnIndex) => {
  await focusTable(wrapper);
  const [row, column] = focusedPosition(wrapper);
  wrapper.vm.focusCell(wrapper.vm.records[row].__id, wrapper.vm.columns[column].key, 0, rowIndex - row, false);
  await flush();
  const keys = wrapper.vm.columns.map(c => c.key);
  wrapper.vm.focused = { row: wrapper.vm.records[rowIndex].__id, column: keys[columnIndex] };
  await flush();
  wrapper.vm.focusedRef.focusCell();
  await flush();
};

describe("focus", () => {
  it("has no focused cell until the table gets the focus", () => {
    expect(focusedPosition(mountTable())).toBeNull();
  });

  it("focuses the first editable cell when the table gets the focus", async () => {
    const wrapper = mountTable({
      columns: [{ key: "id", label: "Id", editable: false }, ...exampleColumns()],
      rows: exampleRows().map((r, i) => ({ id: i, ...r })),
    });
    await focusTable(wrapper);
    expect(focusedPosition(wrapper)).toEqual([0, 1]);
    expect(document.activeElement).toBe(cellOf(wrapper, 0, 1).element);
  });

  it("restores the last focused cell when the table gets the focus again", async () => {
    const wrapper = mountTable();
    await focusCell(wrapper, 1, 3);
    document.activeElement.blur();
    await focusTable(wrapper);
    expect(focusedPosition(wrapper)).toEqual([1, 3]);
  });
});

describe("activity", () => {
  // The table checks every 100ms whether the focus is inside it
  const check = async () => {
    vi.advanceTimersByTime(100);
    await flush();
  };
  const isActive = (wrapper) => !wrapper.classes().includes("editable-table-non-active");

  it("is not active until the focus is inside the table", async () => {
    const wrapper = mountTable();
    await check();
    expect(isActive(wrapper)).toBe(false);
    expect(wrapper.emitted("update")).toBeUndefined();
  });

  it("becomes active when the focus moves inside and emits the rows", async () => {
    const wrapper = mountTable();
    await focusTable(wrapper);
    expect(isActive(wrapper)).toBe(false);
    await check();
    expect(isActive(wrapper)).toBe(true);
    expect(wrapper.emitted("update")).toEqual([[exampleRows()]]);
  });

  it("becomes not active when the focus leaves the table and emits the rows", async () => {
    const wrapper = mountTable();
    await focusTable(wrapper);
    await check();
    document.activeElement.blur();
    await check();
    expect(isActive(wrapper)).toBe(false);
    expect(wrapper.emitted("update")).toEqual([[exampleRows()], [exampleRows()]]);
  });

  it("does not emit the rows while the focus moves inside the table", async () => {
    const wrapper = mountTable();
    await focusCell(wrapper, 0, 3);
    await check();
    await pressOnFocused(wrapper, "ArrowDown");
    await check();
    await pressOnFocused(wrapper, "Enter");
    await check();
    expect(isActive(wrapper)).toBe(true);
    expect(wrapper.emitted("update")).toHaveLength(1);
  });

  it("stops the check when the table is unmounted", async () => {
    const wrapper = mountTable();
    expect(vi.getTimerCount()).toBe(1);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("keyboard in non-editing mode", () => {
  describe("arrows", () => {
    it("Arrow right moves to the next editable cell", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 0);
      await pressOnFocused(wrapper, "ArrowRight");
      expect(focusedPosition(wrapper)).toEqual([0, 2]);
      await pressOnFocused(wrapper, "ArrowRight");
      expect(focusedPosition(wrapper)).toEqual([0, 3]);
      expect(document.activeElement).toBe(cellOf(wrapper, 0, 3).element);
    });

    it("Arrow left moves to the previous editable cell", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, "ArrowLeft");
      expect(focusedPosition(wrapper)).toEqual([0, 2]);
      await pressOnFocused(wrapper, "ArrowLeft");
      expect(focusedPosition(wrapper)).toEqual([0, 0]);
    });

    it("Arrow down moves to the next row", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, "ArrowDown");
      expect(focusedPosition(wrapper)).toEqual([1, 3]);
    });

    it("Arrow up moves to the previous row", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 1, 3);
      await pressOnFocused(wrapper, "ArrowUp");
      expect(focusedPosition(wrapper)).toEqual([0, 3]);
    });

    it("Arrow up does nothing in the first row", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, "ArrowUp");
      expect(focusedPosition(wrapper)).toEqual([0, 3]);
      expect(rowsOf(wrapper)).toHaveLength(2);
    });

    it("Arrow right in the last cell of the row moves to the first editable cell of the next row", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 4);
      await pressOnFocused(wrapper, "ArrowRight");
      expect(focusedPosition(wrapper)).toEqual([1, 0]);
    });

    it("Arrow left in the first cell of the row moves to the last editable cell of the previous row", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 1, 0);
      await pressOnFocused(wrapper, "ArrowLeft");
      expect(focusedPosition(wrapper)).toEqual([0, 4]);
    });

    it("Arrow left does nothing in the first cell of the table", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 0);
      await pressOnFocused(wrapper, "ArrowLeft");
      expect(focusedPosition(wrapper)).toEqual([0, 0]);
    });

    it("does not switch to editing mode", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 0);
      for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
        await pressOnFocused(wrapper, key);
      }
      expect(focusedPosition(wrapper)).toEqual([0, 0]);
      expect(wrapper.emitted("editingModeChanged")).toBeUndefined();
    });
  });

  describe("entering to editing mode", () => {
    it.each([["Enter", "Enter"], ["Space", " "]])("%s enters to editing mode", async (name, key) => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, key);
      const cell = cellOf(wrapper, 0, 3);
      expect(isEditing(cell)).toBe(true);
      expect(inputOf(cell).element.value).toBe("555-0101");
      expect(lastEmitted(wrapper, "editingModeChanged")).toBe(true);
    });

    it("a letter or a digit enters to editing mode", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, "7");
      expect(isEditing(cellOf(wrapper, 0, 3))).toBe(true);
      expect(lastEmitted(wrapper, "editingModeChanged")).toBe(true);
    });

    it("other keys do not enter to editing mode", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 3);
      for (const key of ["Shift", "Control", "F2", "Home", "PageDown", "Escape"]) {
        await pressOnFocused(wrapper, key);
      }
      expect(isEditing(cellOf(wrapper, 0, 3))).toBe(false);
      expect(wrapper.emitted("editingModeChanged")).toBeUndefined();
    });
  });

  describe("Del", () => {
    it("removes the row when pressed twice", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, "Delete");
      expect(rowsOf(wrapper)).toHaveLength(2);
      await pressOnFocused(wrapper, "Delete");
      expect(rowsOf(wrapper)).toHaveLength(1);
      expect(cellText(wrapper, 0, 0)).toBe("jane@example.com");
      expect(lastEmitted(wrapper, "update")).toEqual([exampleRows()[1]]);
    });

    it("keeps the focus in the same position after removing", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, "Delete");
      await pressOnFocused(wrapper, "Delete");
      expect(focusedPosition(wrapper)).toEqual([0, 3]);
      expect(document.activeElement).toBe(cellOf(wrapper, 0, 3).element);
    });

    it("moves the focus to the previous row after removing the last row", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 1, 3);
      await pressOnFocused(wrapper, "Delete");
      await pressOnFocused(wrapper, "Delete");
      expect(rowsOf(wrapper)).toHaveLength(1);
      expect(cellText(wrapper, 0, 0)).toBe("john@example.com");
      expect(focusedPosition(wrapper)).toEqual([0, 3]);
    });

    it("does not remove the row when another key is pressed between", async () => {
      const wrapper = mountTable();
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, "Delete");
      await pressOnFocused(wrapper, "Shift");
      await pressOnFocused(wrapper, "Delete");
      expect(rowsOf(wrapper)).toHaveLength(2);
    });

    it("needs to be pressed twice again to remove the next row", async () => {
      const wrapper = mountTable({ rows: [...exampleRows(), ...exampleRows()] });
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, "Delete");
      await pressOnFocused(wrapper, "Delete");
      expect(rowsOf(wrapper)).toHaveLength(3);
      await pressOnFocused(wrapper, "Delete");
      expect(rowsOf(wrapper)).toHaveLength(3);
      await pressOnFocused(wrapper, "Delete");
      expect(rowsOf(wrapper)).toHaveLength(2);
    });

    it("replaces the only row with the empty one", async () => {
      const wrapper = mountTable({ rows: [exampleRows()[0]] });
      await focusCell(wrapper, 0, 3);
      await pressOnFocused(wrapper, "Delete");
      await pressOnFocused(wrapper, "Delete");
      expect(rowsOf(wrapper)).toHaveLength(1);
      expect(rowTexts(wrapper, 0)).toEqual(["", "", "", "", ""]);
      expect(focusedPosition(wrapper)).toEqual([0, 3]);
    });
  });
});

describe("autoAddRow", () => {
  const emptyRow = { email: "", name: "", department: "", phone: "", salary: "" };

  it("adds the new row when moving to the next row from the last one", async () => {
    const wrapper = mountTable();
    await focusCell(wrapper, 1, 3);
    await pressOnFocused(wrapper, "ArrowDown");
    expect(rowsOf(wrapper)).toHaveLength(3);
    expect(rowTexts(wrapper, 2)).toEqual(["", "", "", "", ""]);
    expect(focusedPosition(wrapper)).toEqual([2, 3]);
  });

  it("adds the new row when moving to the next cell from the last cell of the last row", async () => {
    const wrapper = mountTable();
    await focusCell(wrapper, 1, 4);
    await pressOnFocused(wrapper, "ArrowRight");
    expect(rowsOf(wrapper)).toHaveLength(3);
    expect(focusedPosition(wrapper)).toEqual([2, 0]);
  });

  it("adds the new row by Tab in the last cell of the last row", async () => {
    const wrapper = mountTable();
    await focusCell(wrapper, 1, 4);
    await pressOnFocused(wrapper, "Enter");
    const cell = cellOf(wrapper, 1, 4);
    await inputOf(cell).setValue("1300");
    await flush();
    await press(inputOf(cell), "Tab");
    expect(rowsOf(wrapper)).toHaveLength(3);
    expect(focusedPosition(wrapper)).toEqual([2, 0]);
    expect(isEditing(cellOf(wrapper, 2, 0))).toBe(true);
  });

  it("does not add the new row when the last row is empty", async () => {
    const wrapper = mountTable();
    await focusCell(wrapper, 1, 3);
    await pressOnFocused(wrapper, "ArrowDown");
    await pressOnFocused(wrapper, "ArrowDown");
    await pressOnFocused(wrapper, "ArrowDown");
    expect(rowsOf(wrapper)).toHaveLength(3);
    expect(focusedPosition(wrapper)).toEqual([2, 3]);
  });

  it("does not trigger the update event until the new row is edited", async () => {
    const wrapper = mountTable();
    await focusCell(wrapper, 1, 3);
    const count = wrapper.emitted("update")?.length ?? 0;
    await pressOnFocused(wrapper, "ArrowDown");
    expect(wrapper.emitted("update")?.length ?? 0).toBe(count);
    wrapper.vm.updateCell(wrapper.vm.records[2].__id, "phone", "555-0103", { col: 0, row: 0, edit: false });
    await flush();
    expect(lastEmitted(wrapper, "update")).toEqual([...exampleRows(), { ...emptyRow, phone: "555-0103" }]);
  });

  it("does not add the new row when disabled", async () => {
    const wrapper = mountTable({ autoAddRow: false });
    await focusCell(wrapper, 1, 3);
    await pressOnFocused(wrapper, "ArrowDown");
    expect(rowsOf(wrapper)).toHaveLength(2);
    expect(focusedPosition(wrapper)).toEqual([1, 3]);
  });

  it("does not add the new row from the last cell of the last row when disabled", async () => {
    const wrapper = mountTable({ autoAddRow: false });
    await focusCell(wrapper, 1, 4);
    await pressOnFocused(wrapper, "ArrowRight");
    expect(rowsOf(wrapper)).toHaveLength(2);
    expect(focusedPosition(wrapper)).toEqual([1, 4]);
  });

  it("still moves between existing rows when disabled", async () => {
    const wrapper = mountTable({ autoAddRow: false });
    await focusCell(wrapper, 0, 3);
    await pressOnFocused(wrapper, "ArrowDown");
    expect(focusedPosition(wrapper)).toEqual([1, 3]);
    await pressOnFocused(wrapper, "ArrowUp");
    expect(focusedPosition(wrapper)).toEqual([0, 3]);
  });
});
