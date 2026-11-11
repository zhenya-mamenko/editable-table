/**
 * Test application for the end-to-end tests of EditableTable component.
 * Based on the example project, but uses the sources of the component and local data instead of network requests.
 */

import "vuetify/styles";
import { createApp } from "vue";
import { createVuetify } from "vuetify";
import App from "./App.vue";

const vuetify = createVuetify({
  theme: {
    defaultTheme: "light",
  },
});

createApp(App).use(vuetify).mount("#app");
