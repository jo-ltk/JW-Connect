import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'vwwffz',
  e2e: {
    setupNodeEvents(on) {
      // a window large enough for full 1280×900 and 390×844 screenshots
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--window-size=1600,1300');
        }

        return launchOptions;
      });
    },
  },
});
