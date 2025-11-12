import { test, expect } from '@playwright/test'

/**
 * Smoke test - Verify basic PWA setup and Service Worker registration
 */

test.describe('Smoke Tests', () => {
  test('should load runtime.html and register service worker', async ({ page }) => {
    // Navigate to the runtime
    await page.goto('/runtime.html')

    // Check page title
    await expect(page).toHaveTitle(/Minicore Runtime/)

    // Check that main elements are present
    await expect(page.locator('h1')).toContainText('Minicore Runtime')

    // Wait for service worker registration
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        return false
      }

      // Wait for registration
      await new Promise(resolve => setTimeout(resolve, 2000))

      const registration = await navigator.serviceWorker.getRegistration()
      return registration !== undefined
    })

    expect(swRegistered).toBe(true)
  })

  test('should have all required UI elements with test IDs', async ({ page }) => {
    await page.goto('/runtime.html')

    // Check for input/output areas
    await expect(page.getByTestId('input-span')).toBeVisible()
    await expect(page.getByTestId('output-json')).toBeVisible()

    // Check for control buttons
    await expect(page.getByTestId('btn-run')).toBeVisible()
    await expect(page.getByTestId('btn-timeout')).toBeVisible()
    await expect(page.getByTestId('btn-load-example')).toBeVisible()
    await expect(page.getByTestId('btn-clear')).toBeVisible()

    // Check for status message area
    await expect(page.getByTestId('status-message')).toBeVisible()
  })

  test('should load browser bundle successfully', async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/runtime.html')

    // Wait for module to load
    await page.waitForTimeout(2000)

    // Check that Minicore SDK is loaded
    const minicoreLoaded = await page.evaluate(() => {
      return typeof (window as any).minicore !== 'undefined'
    })

    expect(minicoreLoaded).toBe(true)

    // Should have no critical console errors (allow SW warnings)
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('Service Worker') && !err.includes('404')
    )
    expect(criticalErrors.length).toBe(0)
  })

  test('should display offline indicator correctly', async ({ page }) => {
    await page.goto('/runtime.html')

    const offlineIndicator = page.locator('#offlineIndicator')
    await expect(offlineIndicator).toBeVisible()
    await expect(offlineIndicator).toContainText('Online')
  })

  test('should have manifest.webmanifest linked', async ({ page }) => {
    await page.goto('/runtime.html')

    // Check for manifest link
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute('href', '/public/manifest.webmanifest')
  })
})
