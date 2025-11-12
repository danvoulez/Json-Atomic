import { test, expect } from '@playwright/test'

/**
 * Timeout test - Verify timeout handling for infinite loops
 */

test.describe('Timeout Handling', () => {
  test('should timeout infinite loop code', async ({ page }) => {
    await page.goto('/runtime.html')

    const infiniteLoopSpan = {
      type: 'execution',
      kind: 'run_code',
      input: {
        code: 'while(true) { /* infinite loop */ }'
      },
      policy: {
        ttl: '5m',
        timeout: '1s'
      },
      meta: {
        created_at: new Date().toISOString()
      }
    }

    // Set infinite loop input
    await page.getByTestId('input-span').fill(JSON.stringify(infiniteLoopSpan, null, 2))

    // Execute (should timeout)
    await page.getByTestId('btn-run').click()

    // Wait for timeout (give it up to 5 seconds)
    await page.waitForTimeout(5000)

    // Check output
    const output = await page.getByTestId('output-json').inputValue()
    expect(output).toBeTruthy()

    const result = JSON.parse(output)

    // Should indicate timeout
    const hasTimeout = result.timedOut === true ||
                       result.status === 'timeout' ||
                       (result.error && result.error.toLowerCase().includes('timeout'))

    expect(hasTimeout).toBe(true)
  })

  test('should timeout using replay button', async ({ page }) => {
    await page.goto('/runtime.html')

    const infiniteLoopSpan = {
      type: 'execution',
      kind: 'run_code',
      input: {
        code: 'while(true) {}'
      },
      policy: {
        ttl: '5m'
      },
      meta: {
        created_at: new Date().toISOString()
      }
    }

    // Set infinite loop input
    await page.getByTestId('input-span').fill(JSON.stringify(infiniteLoopSpan, null, 2))

    // Execute with replay (timeout button)
    await page.getByTestId('btn-timeout').click()

    // Wait for timeout
    await page.waitForTimeout(5000)

    // Check output
    const output = await page.getByTestId('output-json').inputValue()
    expect(output).toBeTruthy()

    // Should have some result
    const result = JSON.parse(output)
    expect(result).toHaveProperty('status')
  })

  test('should complete fast code before timeout', async ({ page }) => {
    await page.goto('/runtime.html')

    const fastSpan = {
      type: 'execution',
      kind: 'run_code',
      input: {
        code: 'return 1 + 1'
      },
      policy: {
        ttl: '5m',
        timeout: '10s'
      },
      meta: {
        created_at: new Date().toISOString()
      }
    }

    // Set fast code input
    await page.getByTestId('input-span').fill(JSON.stringify(fastSpan, null, 2))

    // Execute
    await page.getByTestId('btn-run').click()
    await page.waitForTimeout(2000)

    // Check output
    const output = await page.getByTestId('output-json').inputValue()
    const result = JSON.parse(output)

    // Should NOT timeout
    expect(result.timedOut).not.toBe(true)
    expect(result.status).not.toBe('timeout')
  })
})
