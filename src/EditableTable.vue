<template>
  <v-container
    class="editable-table"
    :style="height ? `overflow-y: auto; height: ${height}; max-height: ${height};` : ''"
  >
    <v-row
      :class="`d-flex d-sm-none flex-grow-1 ${height ? 'h-100' : ''}`"
    >
      <v-col
        class="text-center align-self-center"
      >
        Not enough space to show the table
      </v-col>
    </v-row>
    <v-row v-if="!noHeader"
      class="flex-nowrap editable-table-header d-none d-sm-flex"
    >
      <v-col v-for="column in columns"
        :class="border ? 'editable-table-header-border' : ''"
        :cols="column.width ?? null"
        :key="column.key"
      >
        {{ column.label }}
      </v-col>
    </v-row>
    <v-row v-for="record in records"
      class="flex-nowrap editable-table-row d-none d-sm-flex"
      :key="record.id"
    >
      <editable-table-cell v-for="column in columns"
        :class="column.class ?? ''"
        :border="border"
        :editable="!readonly && column.editable"
        :focused="focused.row === record.id && focused.column === column.key"
        :format="column.format ?? null"
        :items="column.items ?? []"
        :key="column.key"
        :ref="instance => {cellsRefs[record.id] ??= {}; cellsRefs[record.id][column.key] = instance}"
        :type="column.type"
        :value="record[column.key] ?? null"
        :width="column.width ?? null"
        @delete="deleteRow(record.id)"
        @focus-moved="focusCell(record.id, column.key, $event.col, $event.row, $event.edit)"
        @selected="editing = true; focused = { row: record.id, column: column.key }"
        @update="updateCell(record.id, column.key, $event.value, $event.focusMoved)"
      />
    </v-row>
  </v-container>
</template>

<script>
  import { toRaw } from "vue";
  import EditableTableCell from "./EditableTableCell.vue"

  const validations = {
    int: (value) => {
      if (isNaN(parseInt(value)) || Number(value) !== parseInt(value)) return "Invalid number";
      return true;
    },
    number: (value) => {
      if (isNaN(parseFloat(value))) return "Invalid number";
      return true;
    },
    required: (value) => {
      if (!value || String(value).length === 0) return "Value is required";
      return true;
    },
  }

  export default {
    name: "EditableTable",

    computed: {
      focusedRef() {
        const { row, column } = this.focused;
        return this.cellsRefs[row] ? this.cellsRefs[row][column] : null;
      },
    },

    components: {
      EditableTableCell,
    },

    data() {
      return {
        records: this.rows ?? [],
        focused: { row: null, column: null },
        cellsRefs: [],
        editing: false,
      }
    },

    emits: [
      // update: rows: Array
      // emits when row is updated
      "update",
      // validationError: {rowId: number, columnKey: string, value: any}
      // emits when validation error occurs
      "validationError",
    ],

    methods: {
      deleteRow(rowId) {
        this.records = this.records.filter(r => r.id !== rowId);
        this.emitUpdate();
      },

      doEdit(v) {
        this.focusedRef?.handleClick(v);
      },

      emitUpdate() {
        const event = structuredClone(toRaw(this.records));
        this.$emit("update", event);
      },

      error(rowId, columnKey, value, message) {
        if (!this.noSoundOnError) {
          const snd = new Audio("data:audio/ogg;base64,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");
          snd.volume = 0.1;
          snd.play();
        }
        this.editing = false;
        this.focusedRef.error = true;
        this.doEdit(value);
        this.$emit("validationError", { rowId, columnKey, value, message });
      },

      focusCell(rowId, columnKey, moveCol, moveRow, edit) {
        this.editing = false;
        const rowIndex = this.records.findIndex(r => r.id === rowId);
        if (rowIndex + moveRow === -1) return;
        let row = this.records[rowIndex + moveRow];
        rowId = !row ? (this.newRow() ?? this.records[rowIndex].id) : row.id;

        const columnIndex = this.columns.findIndex(c => c.key === columnKey);
        if (moveCol !== 0) {
          columnKey = moveCol > 0 ? this.columns.slice(columnIndex + 1).find(c => c.editable)?.key :
            this.columns.slice(0, columnIndex).findLast(c => c.editable)?.key;
        }
        if (columnKey) {
          this.focused = { row: rowId, column: columnKey };
        } else {
          if (rowIndex + moveCol === -1) return;
          row = this.records[rowIndex + moveCol];
          if (!row) {
            if (this.newRow()) {
              row = this.records[rowIndex + 1];
              columnKey = (columnIndex === 0 && moveCol < 0) ? this.columns.findLast(c => c.editable).key :
                this.columns.find(c => c.editable).key;
            }
            else {
              row = this.records[rowIndex];
              columnKey = this.columns[columnIndex].key;
            }
          } else {
            columnKey = (columnIndex === 0 && moveCol < 0) ? this.columns.findLast(c => c.editable).key :
              this.columns.find(c => c.editable).key;
          }
          this.focused = {
            row: row.id,
            column: columnKey
          };
        }
        this.$nextTick(() => {
          this.focusedRef?.focusCell();
          if (edit) this.doEdit();
        });
      },

      newRow() {
        if (!this.autoAddRow) return;
        if (this.records.length > 0) {
          const last = this.records[this.records.length - 1];
          if (Object.entries(last).every(v => v[0] === "id" || v[1] === "")) return;
        }
        const id = this.records.length > 0 ? Math.max(...this.records.map(x => x.id)) : 0;
        if (this.readonly) {
          if (this.records.length === 0) throw new Error("No records to show.");
          return id;
        }
        const r = { id: id + 1}
        this.columns.forEach(c => r[c.key] = "");
        this.records.push(r);
        return id + 1;
      },

      updateCell(rowId, columnKey, value, focusMoved) {
        value ??= "";
        const column = this.columns.find(c => c.key === columnKey);
        let validation = column?.validation;
        if (typeof validation === "string") validation = validations[validation];
        if (validation && (typeof validation === "function")) {
          const valid = validation(value, rowId, columnKey);
          if (valid !== true) {
            this.error(rowId, columnKey, value, valid);
            return;
          }
        }
        const record = this.records.find(r => r.id === rowId);
        record[columnKey] = value;
        this.emitUpdate();
        this.$nextTick(() => {
          this.focusCell(rowId, columnKey, focusMoved.col, focusMoved.row, focusMoved.edit && focusMoved.col !== 0);
        });
      },
    },

    mounted() {
      if (this.columns.length > 0 && this.records.length === 0) {
        this.newRow();
      }
    },

    props: {
      // autoAddRow: add new row when try to move to the next row from the last one
      autoAddRow: {
        type: Boolean,
        default: true,
      },
      // border: cells and header have border
      border: Boolean,
      // columns: array of objects contain
      //   class: column class if needed
      //   format: format string for the value. Use {0} for simple type; {title}, {value}, etc for object type as placeholders
      //     HTML accepted. Example: "<i>{0}</i>", "{title} ({value})"
      //   items: array of strings
      //     OR object of
      //     values: array of strings OR objects {title: string, value: number|string, subtitle: string}
      //     exact: boolean (default: false, always true if value is set)
      //     filterSubtitle: boolean (default: true, false if no subtitle) set to false to prevent subtitle filtering;
      //     search: function (value) returning new values
      //   key: column key
      //   label: column label
      //   type: column type
      //   editable: column is editable
      //   validation: column validation standard string OR function (value, rowId, columnKey) returning true or error message
      //   width: column width
      columns: {
        type: Array,
        required: true,
      },
      // height: height of table container
      height: String,
      // noHeader: table has no header
      noHeader: Boolean,
      // noSoundOnError: no sound on validation error
      noSoundOnError: Boolean,
      // readonly: table is read-only
      readonly: Boolean,
      // rows: array of objects, MUST contain unique int id for every record
      rows: {
        type: Array,
        required: true,
      },
    },

    watch: {
      focused() {
        const ref = this.focusedRef;
        if (ref?.$el?.scrollIntoViewIfNeeded) {
          ref.$el.scrollIntoViewIfNeeded(false);
        }
      },
    },
  }
</script>

<style>
  .editable-table {
    --cell-error-outline: 2px solid rgb(var(--v-theme-error));
    --cell-focused-outline: 2px solid rgb(var(--v-theme-secondary));
    --cell-focused-outline-offset: -2px;
    --header-background-color: rgb(var(--v-theme-surface-light));
    --header-border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    --header-bottom-border: 4px double rgba(var(--v-border-color), var(--v-border-opacity));
    --header-font-weight: bold;
    --header-text-align: center;
    --header-text-color: rgb(var(--v-theme-on-surface-light));
    --row-border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .editable-table-header {
    border-bottom: var(--header-bottom-border);
    background-color: var(--header-background-color);
    color: var(--header-text-color);
    font-weight: var(--header-font-weight);
    text-align: var(--header-text-align);
  }

  .editable-table-header-border {
    border-right: var(--header-border);
    border-top: var(--header-border);
  }

  .editable-table-header .editable-table-header-border:first-child {
    border-left: var(--header-border);
  }

  .editable-table-row {
    border-bottom: var(--row-border);
  }

  .v-col.editable-table-cell {
    height: 48px;
    min-height: 48px;
    max-height: 48px;
  }

  .editable-table-cell {
    color: inherit;
  }

  .editable-table-cell-border {
    border-right: var(--row-border);
  }

  .editable-table-row:first-child .editable-table-cell-border {
    border-top: var(--row-border);
  }

  .editable-table-row .editable-table-cell-border:first-child {
    border-left: var(--row-border);
  }

  .editable-table-cell-content input, .editable-table-cell-content .v-field__input {
    padding-top: 0 !important;
    min-height: 24px !important;
  }

  .editable-table-cell-content-right input {
    text-align: right !important;
  }

  .editable-table-cell-focused {
    outline: var(--cell-focused-outline);
    outline-offset: var(--cell-focused-outline-offset);
  }

  .editable-table-cell-error {
    outline: var(--cell-error-outline);
    animation: error 0.3s;
  }

  @keyframes error {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  }
</style>
