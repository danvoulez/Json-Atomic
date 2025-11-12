import { test, expect } from '@playwright/test'

/**
 * Export NDJSON test - Verify ledger export functionality
 */

test.describe('Export NDJSON', () => {
  test('should show export button after execution', async ({ page }) => {
    await page.goto('/runtime.html')

    await page.waitForTimeout(500)

    // Initially export button should be hidden
    const exportButton = page.getByTestId('btn-export-ndjson')
    await expect(exportButton).toBeHidden()

    // Execute
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(2000)

    // Now export button should be visible
    await expect(exportButton).toBeVisible()
  })

  test('should export ledger as NDJSON', async ({ page }) => {
    await page.goto('/runtime.html')

    await page.waitForTimeout(500)

    // Execute a few times to create ledger entries
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(2000)

    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(2000)

    // Setup download handler
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 })

    // Click export
    await page.getByTestId('btn-export-ndjson').click()

    // Wait for download
    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toMatch(/minicore-ledger-.*\.ndjson/)

    // Get download content
    const path = await download.path()
    expect(path).toBeTruthy()
  })

  test('should export valid NDJSON format', async ({ page, context }) => {
    await page.goto('/runtime.html')

    await page.waitForTimeout(500)

    // Execute
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(2000)

    // Setup download handler
    const downloadPromise = page.waitForEvent('download')

    // Click export
    await page.getByTestId('btn-export-ndjson').click()

    // Wait for download
    const download = await downloadPromise
    const path = await download.path()

    if (path) {
      // Read downloaded file
      const fs = await import('fs')
      const content = fs.readFileSync(path, 'utf-8')

      // Verify NDJSON format (each line is valid JSON)
      const lines = content.trim().split('\n').filter(l => l.length > 0)

      expect(lines.length).toBeGreaterThan(0)

      lines.forEach(line => {
        const obj = JSON.parse(line) // Should not throw
        expect(obj).toBeTruthy()
      })
    }
  })

  test('should include span data in export', async ({ page }) => {
    await page.goto('/runtime.html')

    await page.waitForTimeout(500)

    // Execute
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(2000)

    // Setup download handler
    const downloadPromise = page.waitForEvent('download')

    // Click export
    await page.getByTestId('btn-export-ndjson').click()

    // Wait for download
    const download = await downloadPromise
    const path = await download.path()

    if (path) {
      const fs = await import('fs')
      const content = fs.readFileSync(path, 'utf-8')

      // Parse first line
      const firstLine = content.trim().split('\n')[0]
      const span = JSON.parse(firstLine)

      // Verify span has expected fields
      expect(span).toHaveProperty('type')
      expect(span).toHaveProperty('kind')
    }
  })

  test('should show success message after export', async ({ page }) => {
    await page.goto('/runtime.html')

    await page.waitForTimeout(500)

    // Execute
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(2000)

    // Setup download handler
    const downloadPromise = page.waitForEvent('download')

    // Click export
    await page.getByTestId('btn-export-ndjson').click()

    await downloadPromise

    // Wait a bit for status update
    await page.waitForTimeout(500)

    // Check status message
    const status = await page.getByTestId('status-message').textContent()
    expect(status).toContain('Exported')
  })
})
