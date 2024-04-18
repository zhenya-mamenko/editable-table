<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col>
            <h1 class="display-1">Editable Table</h1>
            <p class="mt-2">
              This component is a Vue 3 (Vuetify 3 based) editable table designed for use in web applications.
              It is a simple and easy-to-use component that allows you to create a table with editable cells.
            </p>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6" class="pe-1">
            <p>
              This example demonstrates the use of the EditableTable component with the following features:
            </p>
            <ul class="ms-8 mt-1">
              <li>Dynamic loading items</li>
              <li>Custom validation</li>
              <li>Cell classes</li>
              <li>Non-editing cells</li>
              <li>Autocompletion</li>
              <li>Auto-adding new row</li>
              <li>Text format for objects and plain strings</li>
              <li>Events handling</li>
            </ul>
          </v-col>
          <v-col cols="1"></v-col>
          <v-col cols="5">
            <v-card  class="mt-n3">
              <v-card-title>
                You can use keyboard while using the table
              </v-card-title>
              <v-card-text>
                <ul class="ms-8">
                  <li>
                    In editing mode:
                    <ul class="ms-4 mt-1">
                      <li><kbd>Arrow down</kbd> — open the dropdown list;</li>
                      <li><kbd>Tab</kbd> — move to the next cell;</li>
                      <li><kbd>Shift+Tab</kbd> — move to the previous cell;</li>
                      <li><kbd>Enter</kbd> — save the value and exit from editing mode;</li>
                      <li><kbd>Esc</kbd> — exit from editing mode without saving the value.</li>
                    </ul>
                  </li>
                  <li class="mt-2">
                    In non-editing mode:
                    <ul class="ms-4 mt-1">
                      <li><kbd>Arrow up</kbd> — move to the previous row;</li>
                      <li><kbd>Arrow down</kbd> — move to the next row;</li>
                      <li><kbd>Arrow left</kbd> — move to the previous cell;</li>
                      <li><kbd>Arrow right</kbd>  — move to the next cell;</li>
                      <li><kbd>Enter</kbd> / <kbd>Space</kbd> — enter to editing mode;</li>
                      <li><kbd>Del</kbd> <span class="text-caption">(x2)</span> — remove the row.</li>
                    </ul>
                  </li>
                </ul>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <EditableTable
            ref="table"
              border
              :columns="columns"
              :rows="rows"
              tabindex="1"
              @update="handleUpdate"
              @validation-error="handleValidationError"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-alert
              v-if="errorMessage"
              type="error"
              dismissible
              elevation="2"
              icon="mdi-alert"
            >
              {{ errorMessage }}
            </v-alert>
          </v-col>
        </v-row>
        <v-footer><p>Copyright (c) 2024-present, &nbsp; <a href="https://github.com/zhenya-mamenko/editable-table/">Zhenya Mamenko</a></p></v-footer>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import EditableTable from '@mamenko/editable-table';

const avatarTemplate = '<div class="v-avatar v-avatar--start v-theme--light v-avatar--density-default v-avatar--variant-flat" style="width: 24px; height: 24px;"><div class="v-responsive v-img"><div class="v-responsive__sizer" style="padding-bottom: 100%;"></div><img class="v-img__img v-img__img--cover" src="{avatar}"></div><span class="v-avatar__underlay"></span></div>'

export default {
  components: {
    EditableTable
  },

  data() {
    return {
      errorMessage: "",
      columns: [
        { key: "email", label: "Email", type: "email", editable: true, width: 3, validation: this.emailValidation,
          items: {
            values: [],
            exact: true,
            search: this.emailSearch,
          },
        },
        { key: "name", label: "Name", type: "text", editable: false, width: 3, class: "bg-grey-lighten-5",
          format: `${avatarTemplate}{name}`,
        },
        { key: "department", label: "Department", type: "text", editable: true, width: 3, validation: "required",
          items: {
            values: [
              {value: 1, title: 'HR', subtitle: 'Human resources'},
              {value: 2, title: 'IT', subtitle: 'Information technology and something more just for text'},
              {value: 3, title: 'Finance', subtitle: 'Accounting and finance'},
              {value: 4, title: 'Sales', subtitle: 'Sales and marketing'},
              {value: 5, title: 'Operations', subtitle: 'Operations and logistics'},
              {value: 6, title: 'Legal', subtitle: 'Legal and compliance'},
              {value: 7, title: 'Admin', subtitle: 'Administration and support'},
              {value: 8, title: 'R&D', subtitle: 'Research and development'},
              {value: 9, title: 'Production', subtitle: 'Manufacturing and production'},
              {value: 10, title: 'Quality', subtitle: 'Quality assurance and control'}, 
            ],
            exact: true,
          },
          format: "{title} ({subtitle})",
        },
        { key: "phone", label: "Phone", type: "tel", editable: true, width: 2},
        { key: "salary", label: "Salary", type: "number", editable: true, validation: "int", format: "${0}", items: [1000, 1200, 1500] },
      ],
      loadedData: {},
      rows: [],
    }
  },

  methods: {
    async emailSearch(value) {
      let users = [];
      if (value?.length > 0) {
        const response = await fetch(`https://reqres.in/api/users?per_page=100&page=1`);
        const data = await response.json();
        users = data.data
          .filter(user => user.email.toLowerCase().includes(value.toLowerCase()) || `${user.first_name} ${user.last_name}`.toLowerCase().includes(value.toLowerCase()))
          .map(user => ({ user_id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, avatar: user.avatar }));
      }
      this.loadedData["users"] = users;
      return users.map(user => ({...user, value: user.email, title: user.email, subtitle: `${user.first_name} ${user.last_name}` }));
    },
    emailValidation(value, row, columnKey) {
      if (!value || value.length === 0) return "Email must be selected";
      if (this.loadedData?.users?.find) {
        const data = this.loadedData.users.find(d => d.email === value.value);
        row["name"] = { name: `${data.first_name} ${data.last_name}`, avatar: data.avatar };
      } else {
        row["name"] =  "";
      }
      return true;
    },
    handleUpdate(rows) {
      console.log("Updated rows:", rows);
    },
    handleValidationError({rowId, columnKey, value, message}) {
      console.info(`Validation error on [${rowId}][${columnKey}], value: ${value}, message: ${message}`);
      this.errorMessage = message;
    },
  },
  watch: {
    errorMessage(value) {
      if (value) {
        setTimeout(() => {
          this.errorMessage = "";
        }, 3000);
      }
    }
  },
}
</script>
