// ESM configuration for @vscode/test-cli
// Docs: https://code.visualstudio.com/api/working-with-extensions/testing-extension
import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/**/*.test.js',
  mocha: {
    ui: 'tdd',
    timeout: 20000,
    color: true,
  },
});


