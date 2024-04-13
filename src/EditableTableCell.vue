<template>
  <v-col
    :class="`editable-table-cell text-no-wrap text-truncate
      text-${isRightAligned(type) ? 'right' : 'left'}
      cursor-${editable ? 'text' : 'default'}
      ${focused ? 'editable-table-cell-focused' : ''}
      ${error ? 'editable-table-cell-error' : ''}
      ${border ? 'editable-table-cell-border' : ''}
    `"
    :cols="colWidth"
    :tabindex="editable ? 0 : null"
    @click="handleClick"
    @keydown.self="handleKeydown"
  >
    <span
      :class="`${!showInput ? '' : ' d-none'}`"
      v-html="html"
    />
    <v-combobox
      :auto-select-first="exact"
      :class="`w-100 editable-table-cell-content
        ${showInput ? '' : 'd-none'}
        ${isRightAligned(type) ? 'editable-table-cell-content-right' : ''}
      `"
      density="compact"
      :filter-keys="filterKeys"
      flat
      focused
      hide-details
      hide-no-data
      hide-spin-buttons
      :items="listItems"
      :loading="loading"
      :menu-icon="null"
      :open-on-clear="false"
      ref="inputElement"
      :return-object="returnObject"
      single-line
      :type="type"
      variant="plain"
      v-model="inputValue"
      @blur="handleBlur(0)"
      @keydown.enter.passive="handleBlur(0, $event)"
      @keydown.enter.prevent.stop="handleBlur(0)"
      @keydown.shift.tab.stop.prevent="handleBlur(-1)"
      @keydown.tab.exact.stop.prevent="handleBlur(1)"
      @keydown.esc.stop.prevent="cancelEdit"
      @update:menu="handleMenu"
      @update:search="handleSearch"
    />
  </v-col>
</template>

<script>
  export default {
    name: "EditableTableCell",

    computed: {
      editing: {
        get() {
          return this.$parent.$parent.$parent.editing;
        },
        set(v) {
          this.$parent.$parent.$parent.editing = v;
        },
      },

      error: {
        get() {
          return this.showError;
        },
        set(v) {
          if (!v) {
            this.showError = false;
            return;
          } else {
            this.showError = true;
            setTimeout(() => {
              this.showError = false;
            }, 300);
          }
        },
      },

      filterKeys() {
        let subtitle = [];
        if (
          this.showInput
          && this.items.filterSubtitle !== false
          && !!this.listItems
          && this.listItems.length !== 0
          && this.listItems[0].props?.subtitle
        ) subtitle = ["props.subtitle"];
        return ["title", ...subtitle];
      },

      html() {
        if (this.format && this.value && this.value !== "") {
          const v = isPlainObject(this.value) ? flattenObject(this.value) : this.value;
          return this.format.formatUnicorn(v);
        }
        return (isPlainObject(this.value) ? this.value.title : this.value) ?? "";
      }
    },

    data() {
      return {
        colWidth: this.width ?? null,
        exact: false,
        inputValue: this.value,
        lastKey: "",
        listItems: undefined,
        loading: false,
        menuOpened: false,
        returnObject: false,
        showInput: false,
        showError: false,
        values: [],
      }
    },

    emits: [
      // delete: void
      // emits when delete key is pressed twice
      "delete",
      // focusMoved: {col: number, row: number, edit: boolean}
      // emits when focus should be moved to another cell
      "focusMoved",
      // selcted: void
      // emits when cell is selected
      "selected",
      // update: {value: any, focusMoved: {col: number, row: number, edit: boolean}}
      // emits when cell value is updated
      "update"
    ],

    methods: {
      cancelEdit() {
        this.showInput = false;
        this.inputValue = this.value;
        this.editing = false;
        this.focusCell();
      },

      focusCell() {
        this.$refs.inputElement.closest("div.v-col").focus();
      },

      handleBlur(moveCol, event) {
        if (this.showInput && !this.menuOpened) {
          if (event instanceof Event) {
            event.stopImmediatePropagation();
          }
          let value = this.inputValue ?? "";
          const hasValue = Object.hasOwn(value, "value");
          value = hasValue ? value.value : value;
          let item = this.listItems?.find(i => (hasValue ? i.value : i.title ?? i) == value);
          if (this.returnObject) {
            item = this.values?.find(i => i.value == value);
          }
          if (this.exact && value && value !=="" && !item) {
            this.cancelEdit();
            return;
          }
          this.showInput = false;
          this.$emit("update", {value: this.exact ? item : value, focusMoved: {col: moveCol, row: 0, edit: true}});
        }
      },

      handleClick(value) {
        if (!this.editable || this.showInput) return;
        if (this.editing) return;
        this.$emit("selected");
        this.showInput = true;
        this.inputValue = typeof value === "string" ? value : this.value
        this.$nextTick(() => {
          this.$refs.inputElement.focus();
        });
      },

      handleKeydown(e) {
        let prevent = true;
        let key = e.key;
        if (key === "Delete") {
          if (this.lastKey === "Delete") {
            key = "";
            this.$emit("delete");
          }
        } else if (key === "Enter") {
          this.handleClick();
        } else if (key === "Tab") {
          this.$emit("focusMoved", {col: e.shiftKey ? -1 : 1, row: 0, edit: false});
        } else if (key === "ArrowRight" || key === "ArrowLeft") {
          this.$emit("focusMoved", {col: key === "ArrowRight" ? 1 : -1, row: 0, edit: false});
        } else if (key === "ArrowDown" || key === "ArrowUp") {
          this.$emit("focusMoved", {col: 0, row: key === "ArrowDown" ? 1 : -1, edit: false});
        } else if ((/^[a-z0-9а-я ]$/i).test(key)) {
          this.handleClick(key);
        } else {
          prevent = false;
        }
        this.lastKey = key;
        if (prevent) {
          e.preventDefault();
          e.stopPropagation();
        }
      },

      handleMenu(v) {
        this.menuOpened = v && this.listItems?.length > 0;
      },

      async handleSearch(v) {
        if (isPlainObject(this.items) && this.items.search) {
          this.loading = true;
          let values = this.items.search(v);
          if (values instanceof Promise) values = await values;
          const items = {...this.items, values};
          this.loadItems(items);
          this.loading = false;
        }
      },

      isRightAligned(t) {
        return ['number', 'tel'].includes(t);
      },

      loadItems(items) {
        this.values = [];
        let listItems = undefined;
        if (items instanceof Array) {
          listItems = items.map(x => x.toString());
        } else if (isPlainObject(items)) {
          if (items.values.length > 0 && !isPlainObject(items.values[0])) {
            this.listItems = (!items.exact ? items.values : Array.from(new Set(items.values))).map(x => x.toString());
          } else {
            if (items.values.length > 0) {
              if (Object.hasOwn(items.values[0], "value")) this.returnObject = true;
              this.values = items.values;
              listItems = items.values.map(v => {
                const result = { title: v.title, value: v.value ?? v.title };
                if (v.subtitle) result.props = { subtitle: v.subtitle };
                return result;
              });
            }
          }
          this.exact = !!items.exact && (items.values.length > 0);
        }
        this.listItems = listItems;
      },
    },

    mounted() {
      this.loadItems(this.items);
    },

    props: {
      // border: cell has border
      border: {
        type: Boolean,
        default: false,
      },
      // editable: cell is editable
      editable: {
        type: Boolean,
        default: true,
      },
      // focused: cell is focused
      focused: {
        type: Boolean,
        default: false,
      },
      // format: format string for the value. Use {0} for simple type; {title}, {value}, etc for object type as placeholders
      //  HTML accepted. Example: "<i>{0}</i>", "{title} ({value})"
      format: String,
      // items: list of items for combobox. If item is object, it should have at least title property
      items: [Array, Object],
      // type: input type
      type: {
        type: String,
        default: "text",
        validator(value) {
          return ["text", "email", "tel", "number", "date", "time"].includes(value);
        },
      },
      // value: cell value
      value: {
        type: [String, Number, Object],
        default: "",
      },
      // width: column width in vuetify grid cols
      width: {
        type: Number,
        validator(value) {
          return !value || (value >= 1 && value <= 12 && parseInt(value) === value);
        },
      },
    },

    watch: {
      value(newValue) {
        this.inputValue = newValue;
      },
    },
  };

  // String.formatUnicorn polyfill from https://stackoverflow.com/a/18234317
  String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
    function() {
      "use strict";
      var str = this.toString();
      if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ? Array.prototype.slice.call(arguments) : arguments[0];
        for (key in args) {
          str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
      }
      return str;
    };

  const isPlainObject = (o) => Boolean(
    o && o.constructor && o.constructor.prototype && o.constructor.prototype.hasOwnProperty("isPrototypeOf")
  );

  const flattenObject = (obj, keys=[], keepHierarchy=true) => {
    return Object.keys(obj).reduce((acc, key) => {
      return Object.assign(acc, isPlainObject(obj[key])
        ? flattenObject(obj[key], keys.concat(key), keepHierarchy)
        : {[keepHierarchy ? keys.concat(key).join(".") : key]: obj[key]}
      )
    }, {})
  }
</script>
