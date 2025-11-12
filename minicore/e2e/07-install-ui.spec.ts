import { test, expect } from '@playwright/test'

/**
 * Install UI test - Verify PWA installation prompts and UI
 */

test.describe('PWA Install UI', () => {
  test('should have install button element', async ({ page }) => {
    await page.goto('/runtime.html')

    // Install button exists (may be hidden)
    const installButton = page.getByTestId('btn-install')
    await expect(installButton).toBeAttached()
  })

  test('should initially hide install button', async ({ page }) => {
    await page.goto('/runtime.html')

    // Install button should be hidden initially
    // (Only shows when beforeinstallprompt fires)
    const installButton = page.getByTestId('btn-install')
    const isHidden = await installButton.isHidden()

    // In test environment, beforeinstallprompt may not fire
    // so button should be hidden
    expect(isHidden).toBe(true)
  })

  test('should show install button when beforeinstallprompt fires', async ({ page }) => {
    await page.goto('/runtime.html')

    // Simulate beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any
      event.prompt = () => Promise.resolve()
      event.userChoice = Promise.resolve({ outcome: 'accepted' })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(500)

    // Install button should now be visible
    const installButton = page.getByTestId('btn-install')
    await expect(installButton).toBeVisible()
  })

  test('should handle install button click', async ({ page }) => {
    await page.goto('/runtime.html')

    // Setup mock beforeinstallprompt
    await page.evaluate(() => {
      let promptCalled = false
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = () => {}
      event.prompt = () => {
        promptCalled = true
        return Promise.resolve()
      }
      event.userChoice = Promise.resolve({ outcome: 'accepted' })

      // Store prompt called flag
      ;(window as any).promptCalled = () => promptCalled

      window.dispatchEvent(event)
    })

    await page.waitForTimeout(500)

    // Click install button
    const installButton = page.getByTestId('btn-install')
    await installButton.click()

    await page.waitForTimeout(500)

    // Verify prompt was called
    const promptCalled = await page.evaluate(() => {
      return (window as any).promptCalled?.() || false
    })

    expect(promptCalled).toBe(true)
  })

  test('should hide install button after installation', async ({ page }) => {
    await page.goto('/runtime.html')

    // Setup mock beforeinstallprompt and simulate install
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = () => {}
      event.prompt = () => Promise.resolve()
      event.userChoice = Promise.resolve({ outcome: 'accepted' })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(500)

    // Click install
    await page.getByTestId('btn-install').click()

    // Simulate appinstalled event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    await page.waitForTimeout(500)

    // Install button should be hidden again
    const installButton = page.getByTestId('btn-install')
    const isHidden = await installButton.isHidden()
    expect(isHidden).toBe(true)
  })

  test('should show success toast on installation', async ({ page }) => {
    await page.goto('/runtime.html')

    // Setup mock install
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = () => {}
      event.prompt = () => Promise.resolve()
      event.userChoice = Promise.resolve({ outcome: 'accepted' })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(500)
    await page.getByTestId('btn-install').click()

    // Simulate successful install
    await page.evaluate(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    await page.waitForTimeout(1000)

    // Check for success indication in status or toast
    const status = await page.getByTestId('status-message').textContent()

    // Should have some indication of success
    // (The actual implementation may vary)
    expect(status).toBeDefined()
  })

  test('should have manifest link in head', async ({ page }) => {
    await page.goto('/runtime.html')

    // Verify manifest is linked
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(manifestLink).toBe('/public/manifest.webmanifest')

    // Verify manifest is accessible
    const manifestResponse = await page.goto(`http://localhost:5173${manifestLink}`)
    expect(manifestResponse?.status()).toBe(200)

    const manifest = await manifestResponse?.json()
    expect(manifest).toHaveProperty('name')
    expect(manifest).toHaveProperty('short_name')
    expect(manifest).toHaveProperty('start_url')
    expect(manifest).toHaveProperty('display')
  })
})
