/**
 * Unit tests for Minicore
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts"
import { Minicore, generateKeyPair, verifySpan } from '../core/minicore.ts'

Deno.test("Minicore - Basic Instantiation", () => {
  const minicore = new Minicore()
  const config = minicore.getConfig()
  
  assertExists(config.privateKey, "Should auto-generate private key")
  assertExists(config.publicKey, "Should auto-generate public key")
})

Deno.test("Minicore - Execute run_code successfully", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: {
      code: 'return 2 + 2'
    }
  })
  
  assertEquals(result.output, 4, "Should execute code and return result")
  assertEquals(result.status, 'ok', "Status should be ok")
  assertExists(result.duration_ms, "Should have duration")
  assertExists(result.hash, "Should be signed with hash")
  assertExists(result.signature, "Should be signed")
})

Deno.test("Minicore - Execute code with context", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: {
      code: 'return x + y',
      context: { x: 10, y: 20 }
    }
  })
  
  assertEquals(result.output, 30, "Should use context variables")
})

Deno.test("Minicore - Apply TTL policy (allow)", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return 42' },
    policy: {
      ttl: '5m'
    },
    meta: {
      created_at: new Date().toISOString()  // Current time
    }
  })
  
  assertEquals(result.status, 'ok', "Should allow recent span")
  assertEquals(result.policy_applied?.includes('ttl'), true, "Should apply TTL policy")
})

Deno.test("Minicore - Apply TTL policy (deny)", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return 42' },
    policy: {
      ttl: '1m'  // 1 minute
    },
    meta: {
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()  // 5 minutes ago
    }
  })
  
  assertEquals(result.status, 'error', "Should deny expired span")
  assertExists(result.output?.error, "Should have error message")
})

Deno.test("Minicore - Apply slow policy", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: {
      code: 'return new Promise(resolve => setTimeout(() => resolve(42), 100))'
    },
    policy: {
      slow: '50ms'
    }
  })
  
  assertEquals(result.status, 'ok', "Should execute successfully")
  assertEquals(result.policy_applied?.includes('slow'), true, "Should mark as slow")
})

Deno.test("Minicore - Timeout handling", async () => {
  const minicore = new Minicore({ timeout: 100 })
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: {
      code: 'while(true) {}',  // Infinite loop
      timeout: 100
    }
  })
  
  assertEquals(result.status, 'error', "Should timeout")
  assertExists(result.output?.error, "Should have timeout error")
})

Deno.test("Minicore - Invalid span validation", async () => {
  const minicore = new Minicore()
  
  // Missing required fields should still create a valid span
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return 1' }
  })
  
  assertEquals(result.status, 'ok', "Should handle minimal span")
})

Deno.test("Minicore - Signature verification", async () => {
  const keys = generateKeyPair()
  const minicore = new Minicore({
    privateKey: keys.privateKey,
    publicKey: keys.publicKey
  })
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return "test"' }
  })
  
  assertExists(result.signature, "Should have signature")
  
  // Verify with minicore
  const isValid = minicore.verify(result)
  assertEquals(isValid, true, "Signature should be valid")
  
  // Verify with function
  const isValid2 = verifySpan(result, keys.publicKey)
  assertEquals(isValid2, true, "Signature should be valid with explicit key")
})

Deno.test("Minicore - NDJSON export", async () => {
  const minicore = new Minicore()
  
  await minicore.execute({ kind: 'run_code', input: { code: 'return 1' } })
  await minicore.execute({ kind: 'run_code', input: { code: 'return 2' } })
  await minicore.execute({ kind: 'run_code', input: { code: 'return 3' } })
  
  const ndjson = minicore.exportNDJSON()
  const lines = ndjson.trim().split('\n')
  
  assertEquals(lines.length, 3, "Should have 3 lines")
  
  // Each line should be valid JSON
  lines.forEach(line => {
    const parsed = JSON.parse(line)
    assertExists(parsed.output, "Should have output")
    assertExists(parsed.hash, "Should have hash")
  })
})

Deno.test("Minicore - Execution history", async () => {
  const minicore = new Minicore()
  
  await minicore.execute({ kind: 'run_code', input: { code: 'return 1' } })
  await minicore.execute({ kind: 'run_code', input: { code: 'return 2' } })
  
  const history = minicore.getHistory()
  assertEquals(history.length, 2, "Should have 2 executions in history")
  
  minicore.clearHistory()
  assertEquals(minicore.getHistory().length, 0, "History should be cleared")
})

Deno.test("Minicore - Dry run mode", async () => {
  const minicore = new Minicore({ dry_run: true })
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return 42' }
  })
  
  assertEquals(result.status, 'ok', "Should succeed in dry run")
  // In dry run, signature should not be added
  assertEquals(result.signature, undefined, "Should not sign in dry run")
})

Deno.test("Minicore - Error handling in code execution", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: {
      code: 'throw new Error("Test error")'
    }
  })
  
  assertEquals(result.status, 'error', "Should have error status")
  assertExists(result.output?.error, "Should have error message")
})

Deno.test("Minicore - Unknown kernel", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'unknown_kernel' as any,
    input: {}
  })
  
  assertEquals(result.status, 'error', "Should error on unknown kernel")
})

Deno.test("Minicore - evaluate_prompt kernel (stub)", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'evaluate_prompt',
    input: {
      prompt: 'What is 2+2?',
      model: 'gpt-4'
    }
  })
  
  assertEquals(result.status, 'ok', "Should execute prompt evaluation")
  assertExists(result.output, "Should have output")
})

Deno.test("Minicore - apply_policy kernel", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'apply_policy',
    input: {
      ttl: '10m',
      slow: '100ms'
    }
  })
  
  assertEquals(result.status, 'ok', "Should apply policy")
  assertExists(result.output, "Should have policy result")
})

Deno.test("Minicore - Multiple policies combined", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return 123' },
    policy: {
      ttl: '10m',
      slow: '100ms',
      throttle: { max_requests: 100, window_ms: 60000 }
    }
  })
  
  assertEquals(result.status, 'ok', "Should execute with multiple policies")
  assertEquals(result.policy_applied?.length >= 2, true, "Should apply multiple policies")
})

Deno.test("Minicore - Async code execution", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: {
      code: `
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
        await delay(10)
        return 'async result'
      `
    }
  })
  
  assertEquals(result.output, 'async result', "Should handle async code")
  assertEquals(result.status, 'ok', "Should succeed")
})

Deno.test("Minicore - Trace ID propagation", async () => {
  const minicore = new Minicore()
  
  const traceId = 'test-trace-123'
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return 1' },
    meta: {
      trace_id: traceId
    }
  })
  
  assertEquals(result.trace_id, traceId, "Should preserve trace ID")
})

Deno.test("Minicore - Logs collection", async () => {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return 42' }
  })
  
  assertExists(result.logs, "Should have logs")
  assertEquals(result.logs.length > 0, true, "Should have log entries")
  assertEquals(result.logs.includes('Span created'), true, "Should log span creation")
  assertEquals(result.logs.includes('Span validated'), true, "Should log validation")
})
