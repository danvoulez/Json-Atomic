/**
 * Simple CLI for minicore
 * Usage: deno run --allow-read cli.ts <span-file.json>
 */

import { Minicore } from './core/minicore.ts'

async function main() {
  // Check arguments
  if (Deno.args.length === 0) {
    console.error('Usage: deno run --allow-read cli.ts <span-file.json>')
    console.error('')
    console.error('Examples:')
    console.error('  deno run --allow-read cli.ts examples/demo_span.json')
    console.error('  deno run --allow-read cli.ts examples/code_execution.json')
    Deno.exit(1)
  }
  
  const filename = Deno.args[0]
  
  try {
    // Read span from file
    const spanJson = await Deno.readTextFile(filename)
    const span = JSON.parse(spanJson)
    
    console.log('🚀 Minicore CLI')
    console.log('═'.repeat(50))
    console.log(`📄 Input file: ${filename}`)
    console.log('')
    
    // Create minicore
    const minicore = new Minicore()
    
    // Execute
    console.log('⚡ Executing span...')
    const result = await minicore.execute(span)
    
    console.log('')
    console.log('✅ Execution complete')
    console.log('═'.repeat(50))
    console.log('')
    console.log('📊 Result:')
    console.log(JSON.stringify(result, null, 2))
    console.log('')
    console.log('═'.repeat(50))
    console.log(`Status: ${result.status}`)
    console.log(`Duration: ${result.duration_ms}ms`)
    console.log(`Span ID: ${result.span_id}`)
    console.log(`Trace ID: ${result.trace_id}`)
    console.log(`Signed: ${result.signature ? '✓' : '✗'}`)
    
    if (result.policy_applied && result.policy_applied.length > 0) {
      console.log(`Policies: ${result.policy_applied.join(', ')}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    Deno.exit(1)
  }
}

main()
