# EditableTable

This component is a Vue 3 (Vuetify 3 based) editable table designed for use in web applications.

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
* `rows` (Array, required): Array of objects representing table row data. MUST contain unique integer id for every record.

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
* `validation` (String|Function): Column validation standard string or function returning true or error message.
* `width` (Number): Column width (1-12) in Vuetify grid units.

## Events

* `update` (rows: Array): Triggered when a row's data is updated.
* `validationError` ({rowId: number, columnKey: string, value: any, message: string}): Triggered when a validation error occurs.

## Styles

CSS variables define various visual aspects of the editable table component, such as cell outlines, header styles, and row borders. These properties can be customized or overridden to achieve the desired visual appearance of the table. Default values use variables from Vuetify.

```css
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

## Dependencies

This component requires `vue` version 3.4.0 and above; `vuetify` version 3.5.11 and above.

## License

This project is licensed under the MIT License.

## Author

[Zhenya Mamenko](https://github.com/zhenya-mamenko/editable-table)
