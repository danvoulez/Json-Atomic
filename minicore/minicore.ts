#!/usr/bin/env node
/**
 * Minicore CLI - Command-line interface for JSON✯Atomic span execution
 * 
 * Commands:
 *   minicore run <file>     - Execute a span from a JSON file
 *   minicore sign <file>    - Sign a span and output signed version
 *   minicore chat           - Interactive chat mode for span execution
 *   minicore verify <file>  - Verify a signed span or NDJSON ledger
 *   minicore help           - Show help information
 */

import { Minicore } from './src/core.ts'
import { signSpan, verifySpan, generateKeyPair } from './src/signer.ts'
import { verifyLedger, formatVerificationReport } from './src/verifyLedger.ts'
import type { Span, SignedSpan } from './src/types.ts'

// Runtime detection
const isDeno = typeof Deno !== 'undefined'
const readFile = isDeno 
  ? (path: string) => Deno.readTextFile(path)
  : async (path: string) => {
      const fs = await import('fs/promises')
      return fs.readFile(path, 'utf-8')
    }

const writeFile = isDeno
  ? (path: string, content: string) => Deno.writeTextFile(path, content)
  : async (path: string, content: string) => {
      const fs = await import('fs/promises')
      await fs.writeFile(path, content, 'utf-8')
    }

const readStdin = isDeno
  ? async () => {
      const decoder = new TextDecoder()
      const buf = new Uint8Array(1024)
      let input = ''
      while (true) {
        const n = await Deno.stdin.read(buf)
        if (n === null) break
        input += decoder.decode(buf.subarray(0, n))
      }
      return input.trim()
    }
  : async () => {
      const readline = await import('readline')
      return new Promise<string>((resolve) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })
        let lines: string[] = []
        rl.on('line', (line) => lines.push(line))
        rl.on('close', () => resolve(lines.join('\n')))
      })
    }

/**
 * Main CLI entry point
 */
async function main() {
  const args = isDeno ? Deno.args : process.argv.slice(2)
  const command = args[0]
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp()
    return
  }
  
  try {
    switch (command) {
      case 'run':
        await runCommand(args.slice(1))
        break
      
      case 'sign':
        await signCommand(args.slice(1))
        break
      
      case 'chat':
        await chatCommand(args.slice(1))
        break
      
      case 'verify':
        await verifyCommand(args.slice(1))
        break
      
      default:
        console.error(`Unknown command: ${command}`)
        console.error('Run "minicore help" for usage information')
        exit(1)
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    exit(1)
  }
}

/**
 * Run command - Execute a span from file
 */
async function runCommand(args: string[]) {
  if (args.length === 0) {
    console.error('Usage: minicore run <file>')
    console.error('Example: minicore run span.json')
    exit(1)
  }
  
  const filename = args[0]
  const content = await readFile(filename)
  const span = JSON.parse(content) as Partial<Span>
  
  console.log('🚀 Minicore - Executing Span')
  console.log('═'.repeat(60))
  console.log(`📄 File: ${filename}`)
  console.log(`🔧 Kind: ${span.kind || 'unknown'}`)
  console.log('')
  
  // Create minicore instance
  const minicore = new Minicore()
  
  // Execute
  console.log('⚡ Executing...')
  const result = await minicore.execute(span)
  
  console.log('')
  console.log('✅ Execution Complete')
  console.log('═'.repeat(60))
  console.log('')
  console.log(JSON.stringify(result, null, 2))
  console.log('')
  console.log('═'.repeat(60))
  console.log(`Status: ${result.status}`)
  console.log(`Duration: ${result.duration_ms}ms`)
  console.log(`Span ID: ${result.span_id}`)
  console.log(`Trace ID: ${result.trace_id}`)
  console.log(`Hash: ${result.hash.substring(0, 16)}...`)
  console.log(`Signed: ${result.signature ? '✓' : '✗'}`)
  
  if (result.policy_applied && result.policy_applied.length > 0) {
    console.log(`Policies: ${result.policy_applied.join(', ')}`)
  }
  
  if (result.logs && result.logs.length > 0) {
    console.log('')
    console.log('📋 Logs:')
    result.logs.forEach(log => console.log(`  ${log}`))
  }
}

/**
 * Sign command - Sign a span and output signed version
 */
async function signCommand(args: string[]) {
  if (args.length === 0) {
    console.error('Usage: minicore sign <file> [--output <file>]')
    console.error('Example: minicore sign span.json --output signed.json')
    exit(1)
  }
  
  const filename = args[0]
  const outputIndex = args.indexOf('--output')
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null
  
  const content = await readFile(filename)
  const span = JSON.parse(content) as Record<string, unknown>
  
  console.log('🔐 Minicore - Signing Span')
  console.log('═'.repeat(60))
  console.log(`📄 Input: ${filename}`)
  
  // Generate keypair for signing
  const keys = generateKeyPair()
  
  // Sign the span
  const signed = signSpan(span, keys.privateKey)
  
  console.log(`🔑 Public Key: ${keys.publicKey}`)
  console.log(`📝 Hash: ${signed.hash}`)
  console.log(`✍️  Signature: ${signed.signature?.sig.substring(0, 32)}...`)
  console.log('')
  
  // Output
  const output = JSON.stringify(signed, null, 2)
  
  if (outputFile) {
    await writeFile(outputFile, output)
    console.log(`✅ Signed span saved to: ${outputFile}`)
  } else {
    console.log('Signed Span:')
    console.log('─'.repeat(60))
    console.log(output)
  }
  
  console.log('')
  console.log('💡 To verify this signature:')
  console.log(`   minicore verify ${outputFile || '<file>'}`)
}

/**
 * Chat command - Interactive REPL mode
 */
async function chatCommand(_args: string[]) {
  console.log('💬 Minicore Chat - Interactive Mode')
  console.log('═'.repeat(60))
  console.log('Enter spans as JSON, one per line')
  console.log('Commands:')
  console.log('  .help     - Show help')
  console.log('  .history  - Show execution history')
  console.log('  .export   - Export history as NDJSON')
  console.log('  .clear    - Clear history')
  console.log('  .exit     - Exit chat mode')
  console.log('═'.repeat(60))
  console.log('')
  
  const minicore = new Minicore()
  
  if (isDeno) {
    // Deno interactive mode
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    
    while (true) {
      await Deno.stdout.write(encoder.encode('minicore> '))
      
      const buf = new Uint8Array(4096)
      const n = await Deno.stdin.read(buf)
      if (n === null) break
      
      const line = decoder.decode(buf.subarray(0, n)).trim()
      
      if (!line) continue
      
      if (line === '.exit') {
        console.log('Goodbye! 👋')
        break
      }
      
      if (line === '.help') {
        showChatHelp()
        continue
      }
      
      if (line === '.history') {
        const history = minicore.getHistory()
        console.log(`Execution History (${history.length} spans):`)
        history.forEach((span, i) => {
          console.log(`  ${i + 1}. ${span.kind} - ${span.status} (${span.duration_ms}ms)`)
        })
        continue
      }
      
      if (line === '.export') {
        const ndjson = minicore.exportNDJSON()
        console.log('NDJSON Export:')
        console.log('─'.repeat(60))
        console.log(ndjson)
        continue
      }
      
      if (line === '.clear') {
        minicore.clearHistory()
        console.log('History cleared ✓')
        continue
      }
      
      // Try to execute as span
      try {
        const span = JSON.parse(line)
        const result = await minicore.execute(span)
        console.log(`✓ ${result.status} (${result.duration_ms}ms)`)
        if (result.output !== undefined) {
          console.log(`  Output: ${JSON.stringify(result.output)}`)
        }
      } catch (err) {
        console.error(`✗ Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  } else {
    // Node.js interactive mode
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'minicore> '
    })
    
    rl.prompt()
    
    rl.on('line', async (line) => {
      const input = line.trim()
      
      if (!input) {
        rl.prompt()
        return
      }
      
      if (input === '.exit') {
        console.log('Goodbye! 👋')
        rl.close()
        return
      }
      
      if (input === '.help') {
        showChatHelp()
        rl.prompt()
        return
      }
      
      if (input === '.history') {
        const history = minicore.getHistory()
        console.log(`Execution History (${history.length} spans):`)
        history.forEach((span, i) => {
          console.log(`  ${i + 1}. ${span.kind} - ${span.status} (${span.duration_ms}ms)`)
        })
        rl.prompt()
        return
      }
      
      if (input === '.export') {
        const ndjson = minicore.exportNDJSON()
        console.log('NDJSON Export:')
        console.log('─'.repeat(60))
        console.log(ndjson)
        rl.prompt()
        return
      }
      
      if (input === '.clear') {
        minicore.clearHistory()
        console.log('History cleared ✓')
        rl.prompt()
        return
      }
      
      // Try to execute as span
      try {
        const span = JSON.parse(input)
        const result = await minicore.execute(span)
        console.log(`✓ ${result.status} (${result.duration_ms}ms)`)
        if (result.output !== undefined) {
          console.log(`  Output: ${JSON.stringify(result.output)}`)
        }
      } catch (err) {
        console.error(`✗ Error: ${err instanceof Error ? err.message : String(err)}`)
      }
      
      rl.prompt()
    })
    
    rl.on('close', () => {
      process.exit(0)
    })
  }
}

/**
 * Verify command - Verify signed span or ledger
 */
async function verifyCommand(args: string[]) {
  if (args.length === 0) {
    console.error('Usage: minicore verify <file>')
    console.error('Example: minicore verify signed.json')
    console.error('         minicore verify ledger.ndjson')
    exit(1)
  }
  
  const filename = args[0]
  const content = await readFile(filename)
  
  console.log('🔍 Minicore - Verifying')
  console.log('═'.repeat(60))
  console.log(`📄 File: ${filename}`)
  console.log('')
  
  // Check if it's NDJSON (multiple lines) or single span
  const lines = content.split('\n').filter(l => l.trim().length > 0)
  
  if (lines.length > 1 || filename.endsWith('.ndjson')) {
    // Verify as ledger
    const result = verifyLedger(content)
    const report = formatVerificationReport(result)
    console.log(report)
    
    if (!result.valid) {
      exit(1)
    }
  } else {
    // Verify single span
    const span = JSON.parse(content) as SignedSpan
    const isValid = verifySpan(span)
    
    console.log(`Status: ${isValid ? '✓ VALID' : '✗ INVALID'}`)
    console.log(`Hash: ${span.hash}`)
    console.log(`Signature Algorithm: ${span.signature?.alg}`)
    console.log(`Public Key: ${span.signature?.public_key}`)
    console.log(`Signed At: ${span.signature?.signed_at}`)
    console.log('')
    
    if (!isValid) {
      console.error('Signature verification failed!')
      exit(1)
    }
    
    console.log('✅ Signature verified successfully!')
  }
}

/**
 * Show main help
 */
function showHelp() {
  console.log(`
🚀 Minicore CLI - JSON✯Atomic Span Execution Runtime

Usage: minicore <command> [options]

Commands:
  run <file>              Execute a span from a JSON file
  sign <file>             Sign a span and output signed version
  chat                    Start interactive chat mode (REPL)
  verify <file>           Verify a signed span or NDJSON ledger
  help                    Show this help message

Examples:
  minicore run span.json
  minicore sign span.json --output signed.json
  minicore chat
  minicore verify ledger.ndjson

Options:
  --help, -h              Show help for a command

For more information, visit: https://github.com/danvoulez/Json-Atomic
`)
}

/**
 * Show chat help
 */
function showChatHelp() {
  console.log(`
Chat Mode Commands:
  .help       - Show this help
  .history    - Show execution history
  .export     - Export history as NDJSON
  .clear      - Clear execution history
  .exit       - Exit chat mode

Example Span:
  {"kind":"run_code","input":{"code":"return 2 + 2"}}
`)
}

/**
 * Exit with code
 */
function exit(code: number): never {
  if (isDeno) {
    Deno.exit(code)
  } else {
    process.exit(code)
  }
}

// Run CLI
if (import.meta.main || (typeof require !== 'undefined' && require.main === module)) {
  main().catch((err) => {
    console.error('Fatal error:', err)
    exit(1)
  })
}
