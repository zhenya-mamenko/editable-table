import { describe, expect, it } from "vitest";
import { VCol } from "vuetify/components/VGrid";
import {
  cellOf, cellsOf, cellText, exampleRows, flush, headerOf, inputOf, isEditing, mountTable, rowsOf, rowTexts, startEdit,
} from "./helpers.js";

describe("props", () => {
  describe("columns", () => {
    it("renders the header with the labels of columns", () => {
      const wrapper = mountTable();
      const labels = headerOf(wrapper).findAll(".v-col").map(c => c.text());
      expect(labels).toEqual(["Email", "Name", "Department", "Phone", "Salary"]);
    });

    it("renders a cell for every column in every row", () => {
      const wrapper = mountTable();
      expect(rowsOf(wrapper)).toHaveLength(2);
      expect(cellsOf(wrapper, 0)).toHaveLength(5);
      expect(cellsOf(wrapper, 1)).toHaveLength(5);
    });
  });

  describe("rows", () => {
    it("renders the values of rows", () => {
      const wrapper = mountTable();
      expect(rowTexts(wrapper, 0)).toEqual(
        ["john@example.com", "John Doe", "IT (Information technology)", "555-0101", "$1000"]
      );
      expect(rowTexts(wrapper, 1)).toEqual(
        ["jane@example.com", "Jane Roe", "Finance (Accounting and finance)", "555-0102", "$1500"]
      );
    });

    it("adds an empty row when there are no rows", async () => {
      const wrapper = mountTable({ rows: [] });
      await flush();
      expect(rowsOf(wrapper)).toHaveLength(1);
      expect(rowTexts(wrapper, 0)).toEqual(["", "", "", "", ""]);
    });

    it("renders new rows when the prop is changed", async () => {
      const wrapper = mountTable();
      await wrapper.setProps({ rows: [{ email: "new@example.com", name: "New", department: "", phone: "", salary: "" }] });
      expect(rowsOf(wrapper)).toHaveLength(1);
      expect(cellText(wrapper, 0, 0)).toBe("new@example.com");
    });

    it("does not change the passed rows", async () => {
      const rows = exampleRows();
      const wrapper = mountTable({ rows });
      wrapper.vm.updateCell(0, "phone", "changed", { col: 0, row: 0, edit: false });
      await flush();
      expect(cellText(wrapper, 0, 3)).toBe("changed");
      expect(rows).toEqual(exampleRows());
    });
  });

  describe("border", () => {
    it("sets borders for the header and cells", () => {
      const wrapper = mountTable({ border: true });
      headerOf(wrapper).findAll(".v-col").forEach(c => expect(c.classes()).toContain("editable-table-header-border"));
      cellsOf(wrapper, 0).forEach(c => expect(c.classes()).toContain("editable-table-cell-border"));
    });

    it("has no borders by default", () => {
      const wrapper = mountTable();
      expect(wrapper.find(".editable-table-header-border").exists()).toBe(false);
      expect(wrapper.find(".editable-table-cell-border").exists()).toBe(false);
    });
  });

  describe("height", () => {
    it("sets the height of the table container and makes it scrollable", () => {
      const wrapper = mountTable({ height: "200px" });
      const style = wrapper.element.style;
      expect(style.height).toBe("200px");
      expect(style.maxHeight).toBe("200px");
      expect(style.overflowY).toBe("auto");
    });

    it("does not limit the height by default", () => {
      const wrapper = mountTable();
      expect(wrapper.element.style.height).toBe("");
      expect(wrapper.element.style.overflowY).toBe("");
    });
  });

  describe("noHeader", () => {
    it("disables the table header", () => {
      const wrapper = mountTable({ noHeader: true });
      expect(headerOf(wrapper).exists()).toBe(false);
      expect(rowsOf(wrapper)).toHaveLength(2);
    });

    it("shows the header by default", () => {
      expect(headerOf(mountTable()).exists()).toBe(true);
    });
  });

  describe("readonly", () => {
    it("prevents editing of the table", async () => {
      const wrapper = mountTable({ readonly: true });
      const cell = await startEdit(wrapper, 0, 0);
      expect(isEditing(cell)).toBe(false);
      expect(wrapper.emitted("editingModeChanged")).toBeUndefined();
      cellsOf(wrapper, 0).forEach(c => expect(c.classes()).toContain("cursor-default"));
    });

    it("ignores the keyboard", async () => {
      const wrapper = mountTable({ readonly: true });
      const cell = cellOf(wrapper, 0, 0);
      for (const key of ["Enter", " ", "a", "Delete", "Delete"]) {
        await cell.trigger("keydown", { key });
        await flush();
      }
      expect(isEditing(cell)).toBe(false);
      expect(rowsOf(wrapper)).toHaveLength(2);
      expect(wrapper.emitted("update")).toBeUndefined();
    });
  });
});

describe("structure of column objects", () => {
  it("class: sets the class of the cells of the column", () => {
    const wrapper = mountTable();
    for (const rowIndex of [0, 1]) {
      expect(cellOf(wrapper, rowIndex, 1).classes()).toContain("bg-grey-lighten-5");
      expect(cellOf(wrapper, rowIndex, 0).classes()).not.toContain("bg-grey-lighten-5");
    }
  });

  it("key: binds the column to the field of the row", () => {
    const wrapper = mountTable({
      columns: [{ key: "b", label: "B", editable: true }, { key: "a", label: "A", editable: true }],
      rows: [{ a: "value a", b: "value b" }],
    });
    expect(rowTexts(wrapper, 0)).toEqual(["value b", "value a"]);
  });

  it("width: sets the width of the column in Vuetify grid units", () => {
    const wrapper = mountTable();
    const widths = [3, 3, 3, 2, null];
    expect(headerOf(wrapper).findAllComponents(VCol).map(c => c.props("cols") ?? null)).toEqual(widths);
    expect(rowsOf(wrapper)[0].findAllComponents(VCol).map(c => c.props("cols") ?? null)).toEqual(widths);
  });

  describe("type", () => {
    it("sets the type of the input", () => {
      const columns = ["text", "email", "tel", "number", "date", "time"].map(type => ({ key: type, type, editable: true }));
      const wrapper = mountTable({ columns, rows: [{}] });
      for (const [index, column] of columns.entries()) {
        expect(inputOf(cellOf(wrapper, 0, index)).attributes("type")).toBe(column.type);
      }
    });

    it("aligns numbers and phones to the right", () => {
      const wrapper = mountTable();
      const alignment = cellsOf(wrapper, 0).map(c => c.classes().includes("text-right") ? "right" : "left");
      expect(alignment).toEqual(["left", "left", "left", "right", "right"]);
      cellsOf(wrapper, 0).forEach((c, index) => expect(c.classes()).toContain(`text-${alignment[index]}`));
    });
  });

  describe("editable", () => {
    it("allows to edit the cells of the editable column", async () => {
      const wrapper = mountTable();
      const cell = await startEdit(wrapper, 0, 0);
      expect(isEditing(cell)).toBe(true);
      expect(cell.classes()).toContain("cursor-text");
    });

    it("prevents editing of the cells of the non-editable column", async () => {
      const wrapper = mountTable();
      const cell = await startEdit(wrapper, 0, 1);
      expect(isEditing(cell)).toBe(false);
      expect(cell.classes()).toContain("cursor-default");
      expect(wrapper.emitted("editingModeChanged")).toBeUndefined();
    });
  });

  describe("format", () => {
    const mountFormatted = (format, value) => mountTable({
      columns: [{ key: "value", label: "Value", editable: true, format }],
      rows: [{ value }],
    });

    it("uses {0} as the placeholder for the value of simple type", () => {
      expect(cellText(mountFormatted("${0}", 1000), 0, 0)).toBe("$1000");
      expect(cellText(mountFormatted("[{0}]", "text"), 0, 0)).toBe("[text]");
    });

    it("uses the names of fields as the placeholders for the value of object type", () => {
      const wrapper = mountFormatted("{title} ({value}): {subtitle}", { title: "IT", value: 2, subtitle: "Information technology" });
      expect(cellText(wrapper, 0, 0)).toBe("IT (2): Information technology");
    });

    it("uses the paths as the placeholders for the nested fields", () => {
      const wrapper = mountFormatted("{user.name}: {user.email}", { user: { name: "John", email: "john@example.com" } });
      expect(cellText(wrapper, 0, 0)).toBe("John: john@example.com");
    });

    it("accepts HTML", () => {
      const wrapper = mountFormatted("<i class=\"formatted\">{0}</i>", "text");
      expect(cellOf(wrapper, 0, 0).find("span i.formatted").text()).toBe("text");
    });

    it("is not applied to the empty value", () => {
      expect(cellText(mountFormatted("${0}", ""), 0, 0)).toBe("");
    });

    it("shows the value as is without the format", () => {
      const columns = [{ key: "value", label: "Value", editable: true }];
      expect(cellText(mountTable({ columns, rows: [{ value: "plain" }] }), 0, 0)).toBe("plain");
      expect(cellText(mountTable({ columns, rows: [{ value: 42 }] }), 0, 0)).toBe("42");
    });

    it("shows the title of the object value without the format", () => {
      const wrapper = mountTable({
        columns: [{ key: "value", label: "Value", editable: true }],
        rows: [{ value: { title: "IT", value: 2 } }],
      });
      expect(cellText(wrapper, 0, 0)).toBe("IT");
    });
  });

  it("uses the default values for the optional fields", () => {
    const wrapper = mountTable({ columns: [{ key: "value" }], rows: [{ value: "text" }] });
    expect(headerOf(wrapper).findAll(".v-col").map(c => c.text())).toEqual([""]);
    expect(cellText(wrapper, 0, 0)).toBe("text");
    expect(inputOf(cellOf(wrapper, 0, 0)).attributes("type")).toBe("text");
    expect(cellOf(wrapper, 0, 0).classes()).toContain("cursor-text");
    expect(cellOf(wrapper, 0, 0).classes()).toContain("text-left");
  });
});
