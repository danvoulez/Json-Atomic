import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Minicore PWA e2e tests
 * Tests Chrome-only for PWA functionality, offline support, and core features
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],

  // Web server to serve the PWA during tests
  webServer: {
    command: 'deno run -A jsr:@std/http@1.0/file-server . --port=5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe'
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools Protocol for Service Worker support
        launchOptions: {
          args: [
            '--enable-features=ServiceWorkerOnUI',
            '--disable-web-security' // Only for testing
          ]
        }
      }
    }
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/'
})
