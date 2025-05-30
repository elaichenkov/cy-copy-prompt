const { defineConfig } = require('cypress');

module.exports = defineConfig({
  watchForFileChanges: false,
  screenshotOnRunFailure: false,
  video: false,
  e2e: {
    env: {
      CY_COPY_PROMPT_ENABLE_LOGS: true,
    },
    setupNodeEvents(on, config) {},
  },
});
