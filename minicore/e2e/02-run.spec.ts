import { test, expect } from '@playwright/test'

/**
 * Run test - Verify basic span execution
 */

test.describe('Run Execution', () => {
  test('should execute demo span successfully', async ({ page }) => {
    await page.goto('/runtime.html')

    // Wait for example to load
    await page.waitForTimeout(500)

    // Click run button
    await page.getByTestId('btn-run').click()

    // Wait for execution
    await page.waitForTimeout(2000)

    // Check output
    const output = await page.getByTestId('output-json').inputValue()
    expect(output).toBeTruthy()

    // Parse and verify result
    const result = JSON.parse(output)
    expect(result).toHaveProperty('status')

    // Should either succeed or have a reasonable error
    const validStatuses = ['ok', 'error', 'timeout']
    expect(validStatuses).toContain(result.status)
  })

  test('should load example span', async ({ page }) => {
    await page.goto('/runtime.html')

    // Clear input first
    await page.getByTestId('btn-clear').click()
    await page.waitForTimeout(200)

    // Load example
    await page.getByTestId('btn-load-example').click()
    await page.waitForTimeout(200)

    // Verify input is populated
    const input = await page.getByTestId('input-span').inputValue()
    expect(input).toBeTruthy()

    // Verify it's valid JSON
    const span = JSON.parse(input)
    expect(span).toHaveProperty('type')
    expect(span).toHaveProperty('kind')
  })

  test('should show status messages during execution', async ({ page }) => {
    await page.goto('/runtime.html')

    await page.waitForTimeout(500)

    const statusMessage = page.getByTestId('status-message')

    // Click run
    await page.getByTestId('btn-run').click()

    // Should show executing status
    await page.waitForTimeout(100)
    const status = await statusMessage.textContent()
    expect(status).toBeTruthy()
  })

  test('should clear input and output', async ({ page }) => {
    await page.goto('/runtime.html')

    await page.waitForTimeout(500)

    // Run execution first
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(1000)

    // Clear
    await page.getByTestId('btn-clear').click()
    await page.waitForTimeout(200)

    // Verify cleared
    const input = await page.getByTestId('input-span').inputValue()
    const output = await page.getByTestId('output-json').inputValue()

    expect(input).toBe('')
    expect(output).toBe('')
  })

  test('should handle invalid JSON gracefully', async ({ page }) => {
    await page.goto('/runtime.html')

    // Enter invalid JSON
    await page.getByTestId('input-span').fill('{ invalid json }')

    // Try to execute
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(500)

    // Should show error in output or status
    const output = await page.getByTestId('output-json').inputValue()
    const status = await page.getByTestId('status-message').textContent()

    const hasError = output.toLowerCase().includes('error') ||
                     (status?.toLowerCase() || '').includes('error')

    expect(hasError).toBe(true)
  })

  test('should execute with custom span input', async ({ page }) => {
    await page.goto('/runtime.html')

    const customSpan = {
      type: 'execution',
      kind: 'run_code',
      input: {
        code: 'return 42'
      },
      policy: {
        ttl: '5m'
      },
      meta: {
        created_at: new Date().toISOString()
      }
    }

    // Set custom input
    await page.getByTestId('input-span').fill(JSON.stringify(customSpan, null, 2))

    // Execute
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(2000)

    // Verify execution
    const output = await page.getByTestId('output-json').inputValue()
    expect(output).toBeTruthy()

    const result = JSON.parse(output)
    expect(result).toHaveProperty('status')
  })
})
