import { describe, expect, it, vi } from "vitest";
import { audio } from "./setup.js";
import {
  cellOf, cellText, departments, edit, exampleRows, flush, focusedPosition, inputOf, isEditing, lastEmitted, mountTable,
  press, rowTexts, startEdit, typeText,
} from "./helpers.js";

const noMove = { col: 0, row: 0, edit: false };

describe("editing", () => {
  it("switches the cell to editing mode by click", async () => {
    const wrapper = mountTable();
    const cell = await startEdit(wrapper, 0, 3);
    expect(isEditing(cell)).toBe(true);
    expect(focusedPosition(wrapper)).toEqual([0, 3]);
    expect(inputOf(cell).element.value).toBe("555-0101");
    expect(document.activeElement).toBe(inputOf(cell).element);
  });

  it("saves the value and exits from editing mode by Enter", async () => {
    const wrapper = mountTable();
    const cell = await edit(wrapper, 0, 3, "555-9999", "Enter");
    expect(isEditing(cell)).toBe(false);
    expect(cellText(wrapper, 0, 3)).toBe("555-9999");
    expect(focusedPosition(wrapper)).toEqual([0, 3]);
    expect(lastEmitted(wrapper, "update")[0].phone).toBe("555-9999");
  });

  it("exits from editing mode without saving the value by Esc", async () => {
    const wrapper = mountTable();
    const cell = await edit(wrapper, 0, 3, "555-9999", "Escape");
    expect(isEditing(cell)).toBe(false);
    expect(cellText(wrapper, 0, 3)).toBe("555-0101");
    expect(focusedPosition(wrapper)).toEqual([0, 3]);
    expect(wrapper.emitted("update")).toBeUndefined();
  });

  it("saves the value and moves to the next editable cell by Tab", async () => {
    const wrapper = mountTable();
    await edit(wrapper, 0, 3, "555-9999", "Tab");
    expect(cellText(wrapper, 0, 3)).toBe("555-9999");
    expect(focusedPosition(wrapper)).toEqual([0, 4]);
    expect(isEditing(cellOf(wrapper, 0, 3))).toBe(false);
    expect(isEditing(cellOf(wrapper, 0, 4))).toBe(true);
  });

  it("saves the value and moves to the previous editable cell by Shift+Tab", async () => {
    const wrapper = mountTable();
    await edit(wrapper, 0, 3, "555-9999", "Tab", { shiftKey: true });
    expect(cellText(wrapper, 0, 3)).toBe("555-9999");
    expect(focusedPosition(wrapper)).toEqual([0, 2]);
    expect(isEditing(cellOf(wrapper, 0, 3))).toBe(false);
    expect(isEditing(cellOf(wrapper, 0, 2))).toBe(true);
  });

  it("skips non-editable cells on Tab", async () => {
    const wrapper = mountTable();
    await edit(wrapper, 0, 0, "new@example.com", "Tab");
    expect(cellText(wrapper, 0, 0)).toBe("new@example.com");
    expect(focusedPosition(wrapper)).toEqual([0, 2]);
    expect(isEditing(cellOf(wrapper, 0, 2))).toBe(true);
  });

  it("moves to the first editable cell of the next row by Tab in the last cell of the row", async () => {
    const wrapper = mountTable();
    await edit(wrapper, 0, 4, "1300", "Tab");
    expect(cellText(wrapper, 0, 4)).toBe("$1300");
    expect(focusedPosition(wrapper)).toEqual([1, 0]);
    expect(isEditing(cellOf(wrapper, 1, 0))).toBe(true);
  });

  it("saves the value when the input loses the focus", async () => {
    const wrapper = mountTable();
    const cell = await startEdit(wrapper, 0, 3);
    await typeText(cell, "555-9999");
    await inputOf(cell).trigger("blur");
    await flush();
    expect(isEditing(cell)).toBe(false);
    expect(cellText(wrapper, 0, 3)).toBe("555-9999");
  });

  it("allows to edit only one cell at the same time", async () => {
    const wrapper = mountTable();
    const first = await startEdit(wrapper, 0, 3);
    const second = await startEdit(wrapper, 1, 3);
    expect(isEditing(first)).toBe(true);
    expect(isEditing(second)).toBe(false);
  });

  it("saves the empty value when the input is cleared", async () => {
    const wrapper = mountTable();
    await edit(wrapper, 0, 3, "", "Enter");
    expect(cellText(wrapper, 0, 3)).toBe("");
    expect(lastEmitted(wrapper, "update")[0].phone).toBe("");
  });
});

describe("events", () => {
  describe("update", () => {
    it("is triggered with all rows when the data of a row is updated", async () => {
      const wrapper = mountTable();
      await edit(wrapper, 1, 3, "555-9999", "Enter");
      const expected = exampleRows();
      expected[1].phone = "555-9999";
      expect(lastEmitted(wrapper, "update")).toEqual(expected);
    });

    it("is triggered when the row is deleted", async () => {
      const wrapper = mountTable();
      wrapper.vm.deleteRow(0);
      await flush();
      expect(lastEmitted(wrapper, "update")).toEqual([exampleRows()[1]]);
    });

    it("passes the copy of the data", async () => {
      const rows = exampleRows();
      const wrapper = mountTable({ rows });
      await edit(wrapper, 0, 3, "555-9999", "Enter");
      const updated = lastEmitted(wrapper, "update");
      expect(updated[0]).not.toBe(rows[0]);
      expect(updated[1]).toEqual(rows[1]);
      expect(updated[1]).not.toBe(rows[1]);
      updated[1].phone = "changed outside";
      await flush();
      expect(cellText(wrapper, 1, 3)).toBe("555-0102");
    });

    it("is not triggered when the value is not valid", async () => {
      const wrapper = mountTable();
      await edit(wrapper, 0, 4, "12.5", "Enter");
      expect(wrapper.emitted("validationError")).toHaveLength(1);
      expect(wrapper.emitted("update")).toBeUndefined();
    });
  });

  describe("editingModeChanged", () => {
    it("is triggered when the cell is switched to editing mode and back", async () => {
      const wrapper = mountTable();
      const cell = await startEdit(wrapper, 0, 3);
      expect(wrapper.emitted("editingModeChanged")).toEqual([[true]]);
      await press(inputOf(cell), "Enter");
      expect(wrapper.emitted("editingModeChanged")).toEqual([[true], [false]]);
    });

    it("is triggered when editing is cancelled", async () => {
      const wrapper = mountTable();
      const cell = await startEdit(wrapper, 0, 3);
      await press(inputOf(cell), "Escape");
      expect(wrapper.emitted("editingModeChanged")).toEqual([[true], [false]]);
    });
  });

  describe("validationError", () => {
    it("is triggered with the details of the error", async () => {
      const wrapper = mountTable();
      await edit(wrapper, 1, 4, "12.5", "Enter");
      expect(wrapper.emitted("validationError")).toEqual([
        [{ rowIndex: 1, columnKey: "salary", value: "12.5", message: "Invalid number" }],
      ]);
    });

    it("keeps the previous value and returns the cell to editing mode", async () => {
      const wrapper = mountTable();
      const cell = await edit(wrapper, 1, 4, "12.5", "Enter");
      expect(isEditing(cell)).toBe(true);
      expect(inputOf(cell).element.value).toBe("12.5");
      await press(inputOf(cell), "Escape");
      expect(cellText(wrapper, 1, 4)).toBe("$1500");
    });

    it("marks the cell with the error for a short time", async () => {
      vi.useFakeTimers();
      try {
        const wrapper = mountTable();
        wrapper.vm.focused = { row: 0, column: "salary" };
        wrapper.vm.updateCell(0, "salary", "abc", noMove);
        await wrapper.vm.$nextTick();
        expect(cellOf(wrapper, 0, 4).classes()).toContain("editable-table-cell-error");
        vi.advanceTimersByTime(300);
        await wrapper.vm.$nextTick();
        expect(cellOf(wrapper, 0, 4).classes()).not.toContain("editable-table-cell-error");
      } finally {
        vi.useRealTimers();
      }
    });
  });
});

describe("validation", () => {
  const validate = async (validation, value, row = { value: "initial" }) => {
    const wrapper = mountTable({
      columns: [{ key: "value", label: "Value", editable: true, validation }, { key: "other", label: "Other" }],
      rows: [row],
      noSoundOnError: true,
    });
    wrapper.vm.updateCell(0, "value", value, noMove);
    await flush();
    return {
      wrapper,
      saved: cellText(wrapper, 0, 0),
      message: lastEmitted(wrapper, "validationError")?.message,
    };
  };

  describe("required", () => {
    it("accepts the non-empty value", async () => {
      expect(await validate("required", "text")).toMatchObject({ saved: "text", message: undefined });
    });

    it("declines the empty value", async () => {
      expect(await validate("required", "")).toMatchObject({ saved: "initial", message: "Value is required" });
      expect(await validate("required", null)).toMatchObject({ saved: "initial", message: "Value is required" });
    });
  });

  describe("int", () => {
    it("accepts the integer number", async () => {
      expect(await validate("int", "12")).toMatchObject({ saved: "12", message: undefined });
      expect(await validate("int", -7)).toMatchObject({ saved: "-7", message: undefined });
    });

    it("declines the fractional number", async () => {
      expect(await validate("int", "12.5")).toMatchObject({ saved: "initial", message: "Invalid number" });
    });

    it("declines the text and the empty value", async () => {
      expect(await validate("int", "abc")).toMatchObject({ saved: "initial", message: "Invalid number" });
      expect(await validate("int", "")).toMatchObject({ saved: "initial", message: "Invalid number" });
    });
  });

  describe("number", () => {
    it("accepts the integer and fractional numbers", async () => {
      expect(await validate("number", "12")).toMatchObject({ saved: "12", message: undefined });
      expect(await validate("number", "12.5")).toMatchObject({ saved: "12.5", message: undefined });
    });

    it("declines the text and the empty value", async () => {
      expect(await validate("number", "abc")).toMatchObject({ saved: "initial", message: "Invalid number" });
      expect(await validate("number", "")).toMatchObject({ saved: "initial", message: "Invalid number" });
    });
  });

  describe("function", () => {
    it("is called with the value, the row and the key of the column", async () => {
      const calls = [];
      const validation = (value, row, columnKey) => {
        calls.push({ value, row: { ...row }, columnKey });
        return true;
      };
      await validate(validation, "new", { value: "initial", other: "other value" });
      expect(calls).toHaveLength(1);
      expect(calls[0].value).toBe("new");
      expect(calls[0].row).toMatchObject({ value: "initial", other: "other value" });
      expect(calls[0].columnKey).toBe("value");
    });

    it("accepts the value when returns true", async () => {
      expect(await validate(() => true, "new")).toMatchObject({ saved: "new", message: undefined });
    });

    it("declines the value when returns the error message", async () => {
      const result = await validate(value => value.length < 3 || "Too long", "long value");
      expect(result).toMatchObject({ saved: "initial", message: "Too long" });
    });

    it("can change other fields of the row", async () => {
      const validation = (value, row) => {
        row.other = `calculated from ${value}`;
        return true;
      };
      const { wrapper } = await validate(validation, "new", { value: "initial", other: "" });
      expect(rowTexts(wrapper, 0)).toEqual(["new", "calculated from new"]);
      expect(lastEmitted(wrapper, "update")).toEqual([{ value: "new", other: "calculated from new" }]);
    });
  });

  it("accepts any value without the validation", async () => {
    expect(await validate(undefined, "anything")).toMatchObject({ saved: "anything", message: undefined });
    expect(await validate(undefined, "")).toMatchObject({ saved: "", message: undefined });
  });

  it("ignores the unknown name of the validation", async () => {
    expect(await validate("unknown", "anything")).toMatchObject({ saved: "anything", message: undefined });
  });

  it("validates the item selected from the list", async () => {
    const wrapper = mountTable();
    wrapper.vm.updateCell(0, "department", departments[0], noMove);
    await flush();
    expect(cellText(wrapper, 0, 2)).toBe("HR (Human resources)");
    wrapper.vm.updateCell(0, "department", "", noMove);
    await flush();
    expect(cellText(wrapper, 0, 2)).toBe("HR (Human resources)");
    expect(lastEmitted(wrapper, "validationError")).toMatchObject({ columnKey: "department", message: "Value is required" });
  });
});

describe("noSoundOnError", () => {
  it("plays the sound on the validation error by default", async () => {
    const wrapper = mountTable();
    await edit(wrapper, 0, 4, "12.5", "Enter");
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.play.mock.calls[0][0].src).toMatch(/^data:audio\//);
  });

  it("disables the sound on the validation error", async () => {
    const wrapper = mountTable({ noSoundOnError: true });
    await edit(wrapper, 0, 4, "12.5", "Enter");
    expect(wrapper.emitted("validationError")).toHaveLength(1);
    expect(audio.play).not.toHaveBeenCalled();
  });

  it("does not play the sound when the value is valid", async () => {
    const wrapper = mountTable();
    await edit(wrapper, 0, 4, "1300", "Enter");
    expect(cellText(wrapper, 0, 4)).toBe("$1300");
    expect(audio.play).not.toHaveBeenCalled();
  });
});
