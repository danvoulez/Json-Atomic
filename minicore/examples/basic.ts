/**
 * Basic Example - Getting started with Minicore
 * Demonstrates core functionality and common use cases
 */

import { Minicore, runSpan, createPlayground } from '../src/sdk.ts'

console.log('═'.repeat(70))
console.log('🚀 MINICORE - Basic Examples')
console.log('═'.repeat(70))
console.log()

// Example 1: Simple code execution
console.log('📝 Example 1: Simple Code Execution')
console.log('─'.repeat(70))

const minicore = new Minicore()

const result1 = await minicore.execute({
  kind: 'run_code',
  input: {
    code: 'return 2 + 2'
  }
})

console.log('Input:', '2 + 2')
console.log('Output:', result1.output)
console.log('Status:', result1.status)
console.log('Duration:', result1.duration_ms, 'ms')
console.log('Signed:', !!result1.signature)
console.log()

// Example 2: Code with context
console.log('📝 Example 2: Code with Context')
console.log('─'.repeat(70))

const result2 = await minicore.execute({
  kind: 'run_code',
  input: {
    code: 'return greeting + " " + name',
    context: {
      greeting: 'Hello',
      name: 'World'
    }
  }
})

console.log('Output:', result2.output)
console.log()

// Example 3: Policy enforcement
console.log('📝 Example 3: Policy Enforcement (TTL)')
console.log('─'.repeat(70))

const result3 = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return Date.now()' },
  policy: {
    ttl: '5m',
    slow: '100ms'
  }
})

console.log('Output:', result3.output)
console.log('Policies applied:', result3.policy_applied)
console.log()

// Example 4: Using runSpan convenience function
console.log('📝 Example 4: Using runSpan Helper')
console.log('─'.repeat(70))

const result4 = await runSpan({
  kind: 'run_code',
  input: {
    code: `
      const numbers = [1, 2, 3, 4, 5]
      return numbers.reduce((sum, n) => sum + n, 0)
    `
  }
})

console.log('Sum of [1,2,3,4,5]:', result4.output)
console.log()

// Example 5: Async code execution
console.log('📝 Example 5: Async Code Execution')
console.log('─'.repeat(70))

const result5 = await minicore.execute({
  kind: 'run_code',
  input: {
    code: `
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
      await wait(100)
      return 'Completed after 100ms'
    `
  }
})

console.log('Output:', result5.output)
console.log('Duration:', result5.duration_ms, 'ms')
console.log()

// Example 6: Error handling
console.log('📝 Example 6: Error Handling')
console.log('─'.repeat(70))

const result6 = await minicore.execute({
  kind: 'run_code',
  input: {
    code: 'throw new Error("Intentional error")'
  }
})

console.log('Status:', result6.status)
console.log('Error:', result6.output)
console.log()

// Example 7: Playground mode
console.log('📝 Example 7: Playground Mode')
console.log('─'.repeat(70))

const playground = createPlayground()

await playground.code('return "Hello from playground!"')
await playground.code('return Math.sqrt(16)')
await playground.code('return { message: "JSON output", value: 42 }')

console.log('Executed', playground.history().length, 'spans in playground')
console.log('Last result:', playground.history()[playground.history().length - 1].output)
console.log()

// Example 8: NDJSON export
console.log('📝 Example 8: NDJSON Export')
console.log('─'.repeat(70))

const ndjson = minicore.exportNDJSON()
const lines = ndjson.trim().split('\n')
console.log('Exported', lines.length, 'spans as NDJSON')
console.log('First span hash:', JSON.parse(lines[0]).hash?.substring(0, 16) + '...')
console.log()

// Example 9: Signature verification
console.log('📝 Example 9: Signature Verification')
console.log('─'.repeat(70))

const result9 = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return "signed span"' }
})

const isValid = minicore.verify(result9)
console.log('Signature valid:', isValid)
console.log('Hash:', result9.hash?.substring(0, 32) + '...')
console.log()

// Example 10: Dry run mode
console.log('📝 Example 10: Dry Run Mode')
console.log('─'.repeat(70))

const dryRunCore = new Minicore({ dry_run: true })

const result10 = await dryRunCore.execute({
  kind: 'run_code',
  input: { code: 'return "This validates but does not execute"' }
})

console.log('Dry run output:', result10.output)
console.log('Signed:', !!result10.signature)
console.log()

// Summary
console.log('═'.repeat(70))
console.log('✨ All Examples Completed!')
console.log('═'.repeat(70))
console.log()
console.log('Total spans executed:', minicore.getHistory().length)
console.log('All spans signed and verifiable:', minicore.getHistory().every(s => s.hash))
console.log()
console.log('Next steps:')
console.log('  • Try loading spans from files with loadFromFile()')
console.log('  • Experiment with prompt evaluation')
console.log('  • Test policy enforcement with expired TTL')
console.log('  • Explore the full API in the SDK documentation')
console.log()
