import { test, expect } from '@playwright/test'

/**
 * Offline test - Verify offline-first functionality via Service Worker
 */

test.describe('Offline Functionality', () => {
  test('should work offline after initial load', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // First load - online
    await page.goto('http://localhost:5173/runtime.html')
    await page.waitForTimeout(2000)

    // Wait for service worker to cache assets
    await page.waitForTimeout(2000)

    // Verify initial online execution works
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(2000)

    const onlineOutput = await page.getByTestId('output-json').inputValue()
    expect(onlineOutput).toBeTruthy()

    // Clear output
    await page.getByTestId('btn-clear').click()
    await page.waitForTimeout(200)

    // Go offline
    await context.setOffline(true)

    // Verify offline indicator
    await page.waitForTimeout(500)
    const offlineIndicator = page.locator('#offlineIndicator')
    await expect(offlineIndicator).toContainText('Offline')

    // Try to execute offline
    await page.getByTestId('btn-load-example').click()
    await page.waitForTimeout(200)

    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(3000)

    // Should still work from cache
    const offlineOutput = await page.getByTestId('output-json').inputValue()
    expect(offlineOutput).toBeTruthy()

    // Parse result
    const result = JSON.parse(offlineOutput)
    expect(result).toHaveProperty('status')

    await context.close()
  })

  test('should reload runtime.html offline from cache', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // First load online to cache
    await page.goto('http://localhost:5173/runtime.html')
    await page.waitForTimeout(3000)

    // Go offline
    await context.setOffline(true)

    // Reload page (should come from cache)
    await page.reload()
    await page.waitForTimeout(1000)

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Minicore Runtime')

    // Verify UI elements are present
    await expect(page.getByTestId('btn-run')).toBeVisible()

    await context.close()
  })

  test('should cache browser bundles for offline use', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Load online first
    await page.goto('http://localhost:5173/runtime.html')
    await page.waitForTimeout(3000)

    // Verify Minicore loaded online
    const onlineLoaded = await page.evaluate(() => {
      return typeof (window as any).minicore !== 'undefined'
    })
    expect(onlineLoaded).toBe(true)

    // Go offline and reload
    await context.setOffline(true)
    await page.reload()
    await page.waitForTimeout(2000)

    // Verify Minicore still loaded from cache
    const offlineLoaded = await page.evaluate(() => {
      return typeof (window as any).minicore !== 'undefined'
    })
    expect(offlineLoaded).toBe(true)

    await context.close()
  })

  test('should cache example JSON files', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Load online
    await page.goto('http://localhost:5173/runtime.html')
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Try to load example (which fetches demo_span.json)
    // Note: This may not work if the example is hardcoded in HTML
    // But the service worker should cache it
    await page.getByTestId('btn-load-example').click()
    await page.waitForTimeout(500)

    const input = await page.getByTestId('input-span').inputValue()
    expect(input).toBeTruthy()

    await context.close()
  })

  test('should show online status when reconnected', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('http://localhost:5173/runtime.html')
    await page.waitForTimeout(1000)

    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    const offlineIndicator = page.locator('#offlineIndicator')
    await expect(offlineIndicator).toContainText('Offline')

    // Go back online
    await context.setOffline(false)
    await page.waitForTimeout(1000)

    // Should show online again
    await expect(offlineIndicator).toContainText('Online')

    await context.close()
  })
})
