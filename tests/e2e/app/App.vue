<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col>
            <button id="before" type="button">Before the table</button>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <EditableTable
              v-bind="props"
              :columns="columns"
              :rows="rows"
              tabindex="0"
              @editingModeChanged="log('editingModeChanged', $event)"
              @update="log('update', $event)"
              @validation-error="log('validationError', $event)"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <button id="after" type="button">After the table</button>
            <button id="replace-rows" type="button" @click="rows = [rows[1]]">Replace rows</button>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import EditableTable from "../../../src/index.js";
import { departments, filledRows, manyRows, searchUsers } from "./data.js";

// The table is configured with the parameters of the page:
//   rows=filled|empty|many - initial rows
//   border=false, noHeader, readonly, noSoundOnError, autoAddRow=false, height=<value> - props of the component
//   filterSubtitle=false - setting of the items of department column
const params = new URLSearchParams(location.search);
const flag = (name, defaultValue = false) => params.has(name) ? params.get(name) !== "false" : defaultValue;

window.__events = [];
window.__searches = [];

export default {
  components: {
    EditableTable,
  },

  data() {
    return {
      columns: [
        { key: "email", label: "Email", type: "email", editable: true, width: 3, validation: this.emailValidation,
          items: {
            values: [],
            exact: true,
            search: this.emailSearch,
          },
        },
        { key: "name", label: "Name", type: "text", editable: false, width: 3, class: "bg-grey-lighten-5 name-cell",
          format: "<b class=\"user-name\">{name}</b> #{id}",
        },
        { key: "department", label: "Department", type: "text", editable: true, width: 3, validation: "required",
          items: {
            values: departments,
            exact: true,
            filterSubtitle: flag("filterSubtitle", true),
          },
          format: "{title} ({subtitle})",
        },
        { key: "phone", label: "Phone", type: "tel", editable: true, width: 2 },
        { key: "salary", label: "Salary", type: "number", editable: true, validation: "int", format: "${0}",
          items: { values: [1000, 1200, 1500], exact: false },
        },
      ],
      foundUsers: [],
      props: {
        autoAddRow: flag("autoAddRow", true),
        border: flag("border", true),
        height: params.get("height") ?? undefined,
        noHeader: flag("noHeader"),
        noSoundOnError: flag("noSoundOnError"),
        readonly: flag("readonly"),
      },
      rows: { empty: [], many: manyRows() }[params.get("rows")] ?? filledRows(),
    };
  },

  methods: {
    async emailSearch(value) {
      window.__searches.push(value);
      this.foundUsers = await searchUsers(value);
      return this.foundUsers;
    },

    // Custom validation: the email must be selected from the list, the name is filled from the selected user
    emailValidation(value, row) {
      if (!value || value.length === 0) return "Email must be selected";
      const user = this.foundUsers.find(u => u.email === value.value) ?? value;
      row.name = { name: `${user.first_name} ${user.last_name}`, id: user.id };
      return true;
    },

    log(name, payload) {
      window.__events.push({ name, payload: JSON.parse(JSON.stringify(payload)) });
    },
  },
};
</script>
