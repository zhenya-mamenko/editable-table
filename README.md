# EditableTable

This component is a Vue 3 (Vuetify 4 based) editable table designed for use in web applications.

## Installation

You can install the component via npm:

```bash
npm install --save @mamenko/editable-table
```

## Usage

```html
<template>
  <EditableTable :columns="columns" :rows="rows" />
</template>

<script>
import EditableTable from '@mamenko/editable-table';

export default {
  components: {
    EditableTable
  },
  data() {
    return {
      columns: [
        // Define column structure here
      ],
      rows: [
        // Define row data here
      ]
    };
  }
};
</script>
```

## Props

* `autoAddRow` (Boolean, default: true): Automatically add a new row when trying to move to the next row from the last one.
* `border` (Boolean): Sets borders for table cells and header.
* `columns` (Array, required): Array of objects describing the structure of table columns.
* `height` (String): Height of the table container.
* `noHeader` (Boolean): Disables table header.
* `noSoundOnError` (Boolean): Disables sound on validation error.
* `readonly` (Boolean): Prevents editing of the table.
* `rows` (Array, required): Array of objects representing table row data.

### Structure of Column Objects

* `class` (String): Column class if needed.
* `format` (String): Value format string for the column.
Use `{0}` for simple type; `{title}`, `{value}`, etc for object type as placeholders. HTML accepted. Example: `<i>{0}</i>`, `{title} ({value})`.
* `items` (Array|Object): Column items. Can be an array of strings or an object containing:
    * `values`: array of strings OR objects with fields {`title`: String, `value`: Number|String, `subtitle`: String};
    * `exact`: boolean (default: false, always true if `value` is set);
    * `filterSubtitle`: boolean (default: true, false if no subtitle) set to false to prevent subtitle filtering;
    * `search`: function (value) returning new values array.
* `key` (String, required): Unique key for the column.
* `label` (String): Column label.
* `type` (String): Column type (`text`, `email`, `tel`, `number`, `date`, `time`).
* `editable` (Boolean): Flag for column editability.
* `validation` (String|Function): Column validation standard string (`int`, `number`, `required`) or function (`value`, `row`: Object, `columnKey`: String) returning `true` or error message.
* `width` (Number): Column width (1-12) in Vuetify grid units.

## Events

* `editingModeChanged` (isEditing: Boolean): Triggered when cell switched in editing mode from viewing or vice versa.
* `update` (rows: Array): Triggered when a row's data is updated.
* `validationError` ({rowIndex: number, columnKey: string, value: any, message: string}): Triggered when a validation error occurs.

## Styles

CSS variables define various visual aspects of the editable table component, such as cell outlines, header styles, and row borders. These properties can be customized or overridden to achieve the desired visual appearance of the table. Default values use variables from Vuetify.

```css
  .editable-table {
    --cell-error-outline: 2px solid rgb(var(--v-theme-error));
    --cell-focused-outline: 2px solid rgb(var(--v-theme-primary));
    --cell-focused-outline-non-active: 2px solid color-mix(in srgb, rgb(var(--v-theme-primary)) calc(var(--v-disabled-opacity) * 100%), transparent);
    --cell-focused-outline-offset: -2px;
    --header-background-color: rgb(var(--v-theme-surface-light));
    --header-border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    --header-bottom-border: 4px double rgba(var(--v-border-color), var(--v-border-opacity));
    --header-font-weight: bold;
    --header-text-align: center;
    --header-text-color: rgb(var(--v-theme-on-surface-light));
    --row-border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
```

These styles for header, rows and cells can be customized too:

```css
.editable-table-header
.editable-table-row
.editable-table-cell
```

## Example

Component in action on [site](http://zhenya-mamenko.github.io/editable-table).

[Source](https://github.com/zhenya-mamenko/editable-table/tree/main/example).

## Development

```bash
npm install        # install dependencies
npm run build      # build the component to dist/
npm test           # run all tests
npm run test:unit  # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright)
```

End-to-end tests are run in the installed Google Chrome. To use the browser of Playwright instead,
install it with `npx playwright install chromium` and set `PW_CHANNEL=chromium`.

## Dependencies

This component requires `vue` version 3.5.0 and above; `vuetify` version 4.0.0 and above.

For Vuetify 3 use version 0.1.6 of the component.

## Migration from 0.1.* to 0.2.*

Version 0.2 moves the component to Vuetify 4. The API of the component is not changed: props, structure of column objects, events and the validation function work the same way as in 0.1.

### Required changes

1. Update `vue` to 3.5 or above and `vuetify` to 4.0 or above. Follow the [Vuetify upgrade guide](https://vuetifyjs.com/en/getting-started/upgrade-guide/) for the rest of your application.
2. Update the component:

    ```bash
    npm install --save @mamenko/editable-table@^0.2.0
    ```

### Styles and layout

* Names of CSS variables and classes are not changed.
* The default value of `--cell-focused-outline-non-active` uses `color-mix()` instead of `rgba(var(--v-theme-primary), ...)`, because theme colors of Vuetify 4 can be translucent. If you override the variable with `rgba(var(--v-theme-...), ...)`, it keeps working for opaque theme colors.
* The grid of Vuetify 4 uses `gap` instead of negative margins of rows and paddings of columns. The table sets its own paddings, so it looks the same as in 0.1. If you override margins or paddings of `.v-row` / `.v-col` inside `.editable-table`, check the result.
* Vuetify 4 adds a hidden input with the value to the combobox of the cell. If your CSS or tests select `.editable-table-cell input`, use `.editable-table-cell input:not([type=hidden])`.

### Fixed behavior

* With `autoAddRow: false` moving down from the last row does nothing, before it threw an error.
* The dropdown list opens again when the typed text starts to match items, including the items loaded by the `search` function.
* Typing a character in non-editing mode filters the dropdown list by this character.
* `Enter` in the dropdown list of the column with the `search` function selects the highlighted item.

## License

This project is licensed under the MIT License.

## Author

[Zhenya Mamenko](https://github.com/zhenya-mamenko/editable-table)
