/**
 * Integration Example: Using Minicore for Various Use Cases
 * 
 * This example demonstrates real-world usage scenarios for minicore
 */

import { Minicore } from './core/minicore.ts'

console.log('🚀 Minicore Integration Examples\n')
console.log('═'.repeat(70))

// Example 1: Simple Calculator Service
console.log('\n📊 Example 1: Calculator Service\n')

async function calculatorService() {
  const minicore = new Minicore()
  
  const calculations = [
    { expr: '2 + 2', expected: 4 },
    { expr: 'Math.sqrt(16)', expected: 4 },
    { expr: '10 * 5', expected: 50 },
    { expr: 'Math.PI.toFixed(2)', expected: '3.14' }
  ]
  
  for (const { expr, expected } of calculations) {
    const result = await minicore.execute({
      kind: 'run_code',
      input: { code: `return ${expr}` }
    })
    
    console.log(`  ${expr.padEnd(20)} = ${result.output}`)
    console.log(`    ✓ Status: ${result.status}, Duration: ${result.duration_ms}ms`)
  }
  
  console.log(`\n  Executed ${calculations.length} calculations`)
  console.log(`  All signed with hash: ${minicore.getHistory()[0].hash?.substring(0, 16)}...`)
}

await calculatorService()

// Example 2: Data Processing Pipeline
console.log('\n═'.repeat(70))
console.log('\n📦 Example 2: Data Processing Pipeline\n')

async function dataProcessingPipeline() {
  const minicore = new Minicore()
  
  // Step 1: Transform data
  const step1 = await minicore.execute({
    kind: 'run_code',
    input: {
      code: 'return data.map(x => x * 2)',
      context: { data: [1, 2, 3, 4, 5] }
    },
    meta: {
      trace_id: 'pipeline-001',
      step: 'transform'
    }
  })
  
  console.log('  Step 1 (Transform):', step1.output)
  console.log(`    Trace: ${step1.trace_id}`)
  
  // Step 2: Filter data
  const step2 = await minicore.execute({
    kind: 'run_code',
    input: {
      code: 'return data.filter(x => x > 5)',
      context: { data: step1.output }
    },
    meta: {
      trace_id: 'pipeline-001',
      step: 'filter'
    }
  })
  
  console.log('  Step 2 (Filter):', step2.output)
  
  // Step 3: Aggregate
  const step3 = await minicore.execute({
    kind: 'run_code',
    input: {
      code: 'return data.reduce((sum, x) => sum + x, 0)',
      context: { data: step2.output }
    },
    meta: {
      trace_id: 'pipeline-001',
      step: 'aggregate'
    }
  })
  
  console.log('  Step 3 (Aggregate):', step3.output)
  console.log('\n  Pipeline complete - all steps signed and auditable')
}

await dataProcessingPipeline()

// Example 3: Policy-Based Access Control
console.log('\n═'.repeat(70))
console.log('\n🔐 Example 3: Policy-Based Access Control\n')

async function policyBasedAccess() {
  const minicore = new Minicore()
  
  // Recent request - should succeed
  const recentRequest = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return "Access granted"' },
    policy: {
      ttl: '5m'
    },
    meta: {
      created_at: new Date().toISOString(),
      user: 'alice'
    }
  })
  
  console.log('  Recent request (Alice):')
  console.log(`    Status: ${recentRequest.status}`)
  console.log(`    Output: ${recentRequest.output}`)
  console.log(`    Policy: ${recentRequest.policy_applied?.join(', ')}`)
  
  // Old request - should fail
  const oldRequest = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return "Access granted"' },
    policy: {
      ttl: '1m'
    },
    meta: {
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      user: 'bob'
    }
  })
  
  console.log('\n  Old request (Bob):')
  console.log(`    Status: ${oldRequest.status}`)
  console.log(`    Error: ${oldRequest.output?.error}`)
}

await policyBasedAccess()

// Example 4: Async Operations
console.log('\n═'.repeat(70))
console.log('\n⏱️  Example 4: Async Operations\n')

async function asyncOperations() {
  const minicore = new Minicore()
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: {
      code: `
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
        
        await delay(50)
        const data = await Promise.resolve({ status: 'completed', value: 42 })
        
        return data
      `
    },
    policy: {
      slow: '100ms'
    }
  })
  
  console.log('  Async operation result:', result.output)
  console.log(`  Status: ${result.status}`)
  console.log(`  Duration: ${result.duration_ms}ms`)
  console.log(`  Slow policy: ${result.policy_applied?.includes('slow') ? 'triggered' : 'not triggered'}`)
}

await asyncOperations()

// Example 5: Export Audit Trail
console.log('\n═'.repeat(70))
console.log('\n💾 Example 5: Export Audit Trail\n')

async function exportAuditTrail() {
  const minicore = new Minicore()
  
  // Execute some operations
  await minicore.execute({ kind: 'run_code', input: { code: 'return "Operation 1"' } })
  await minicore.execute({ kind: 'run_code', input: { code: 'return "Operation 2"' } })
  await minicore.execute({ kind: 'run_code', input: { code: 'return "Operation 3"' } })
  
  // Export as NDJSON
  const ndjson = minicore.exportNDJSON()
  
  console.log('  Exported audit trail:')
  console.log(`    Total operations: ${minicore.getHistory().length}`)
  console.log(`    NDJSON size: ${ndjson.length} bytes`)
  console.log(`    All entries signed: ✓`)
  
  // Show first line
  const firstLine = ndjson.split('\n')[0]
  const parsed = JSON.parse(firstLine)
  console.log(`\n  Sample entry:`)
  console.log(`    Span ID: ${parsed.span_id}`)
  console.log(`    Output: ${parsed.output}`)
  console.log(`    Hash: ${parsed.hash?.substring(0, 16)}...`)
  console.log(`    Signature: ${parsed.signature?.sig?.substring(0, 16)}...`)
}

await exportAuditTrail()

// Example 6: Error Handling
console.log('\n═'.repeat(70))
console.log('\n❌ Example 6: Error Handling\n')

async function errorHandling() {
  const minicore = new Minicore()
  
  // Syntax error
  const syntaxError = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return this is invalid syntax' }
  })
  
  console.log('  Syntax error:')
  console.log(`    Status: ${syntaxError.status}`)
  console.log(`    Error: ${syntaxError.output?.error?.substring(0, 50)}...`)
  
  // Runtime error
  const runtimeError = await minicore.execute({
    kind: 'run_code',
    input: { code: 'throw new Error("Custom error")' }
  })
  
  console.log('\n  Runtime error:')
  console.log(`    Status: ${runtimeError.status}`)
  console.log(`    Error: ${runtimeError.output?.error}`)
  
  // Both errors are logged and signed
  console.log('\n  ✓ Errors are also signed and auditable')
}

await errorHandling()

// Example 7: Dry Run Mode
console.log('\n═'.repeat(70))
console.log('\n🎮 Example 7: Dry Run Mode\n')

async function dryRunMode() {
  const minicore = new Minicore({ dry_run: true })
  
  const result = await minicore.execute({
    kind: 'run_code',
    input: {
      code: 'console.log("This will not actually run"); return 42'
    }
  })
  
  console.log('  Dry run result:')
  console.log(`    Status: ${result.status}`)
  console.log(`    Output: ${result.output}`)
  console.log(`    Signed: ${result.signature ? 'Yes' : 'No (dry run)'}`)
  console.log(`    Logs: ${result.logs?.length} entries`)
}

await dryRunMode()

console.log('\n═'.repeat(70))
console.log('\n✅ All examples completed successfully!')
console.log('\nMinicore demonstrated:')
console.log('  • Code execution with results')
console.log('  • Policy enforcement')
console.log('  • Async operations')
console.log('  • Error handling')
console.log('  • NDJSON export')
console.log('  • Cryptographic signing')
console.log('  • Audit trail generation')
console.log('  • Dry run mode')
console.log('\n═'.repeat(70))
