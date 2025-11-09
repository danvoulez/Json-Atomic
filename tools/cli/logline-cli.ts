#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parse } from "https://deno.land/std/flags/mod.ts"
import { Ledger } from '../../core/ledger/ledger.ts'
import { LedgerVerifier } from '../../core/ledger/verifyLedger.ts'
import { canonicalize } from '../../core/canonical.ts'
import { signAtomic, generateKeyPair, hashAtomic } from '../../core/crypto.ts'
import type { Atomic } from '../../types.ts'

const VERSION = '1.1.0'

const args = parse(Deno.args, {
  string: ['ledger', 'key', 'trace-id', 'output', 'input', 'public-key', 'private-key'],
  boolean: ['help', 'version', 'verbose', 'stop-on-error', 'no-exec', 'dry-run'],
  alias: {
    h: 'help',
    v: 'version',
    l: 'ledger',
    k: 'key',
    o: 'output',
    i: 'input',
  },
})

const command = args._[0] as string
const dryRun = args['no-exec'] || args['dry-run']

// Output formatting helper
type OutputFormat = 'json' | 'ndjson' | 'table'

function formatOutput(data: any, format: OutputFormat = 'table') {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2))
  } else if (format === 'ndjson') {
    if (Array.isArray(data)) {
      data.forEach(item => console.log(JSON.stringify(item)))
    } else {
      console.log(JSON.stringify(data))
    }
  } else {
    // Table format (default)
    if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        console.log(`${key}: ${value}`)
      }
    } else {
      console.log(data)
    }
  }
}

function exitWithError(code: string, message: string, details?: any) {
  const error = { code, message, details }
  if (args.output === 'json') {
    console.error(JSON.stringify(error, null, 2))
  } else {
    console.error(`❌ Error [${code}]: ${message}`)
    if (details) {
      console.error('Details:', details)
    }
  }
  Deno.exit(1)
}

if (args.help || !command) {
  console.log(`
JSON✯Atomic CLI v${VERSION}

USAGE:
  logline-cli [command] [options]

COMMANDS:
  verify              Verify ledger integrity (streaming, no memory limits)
  sign <file>         Sign atomic from JSON file
  query               Query atomics by trace_id
  generate-keys       Generate new Ed25519 key pair
  rotate              Rotate signing keys (placeholder)
  anchor              Anchor ledger state (placeholder)
  lint                Lint ledger file for schema compliance
  migrate             Migrate ledger from v1.0 to v1.1 (placeholder)
  stats               Show ledger statistics
  hash <file>         Compute hash of atomic from JSON file

OPTIONS:
  --ledger, -l <path>       Ledger file path (default: ./data/ledger.jsonl)
  --key, -k <hex>           Public key for verification
  --private-key <hex>       Private key for signing
  --public-key <hex>        Public key (alternative to --key)
  --trace-id <id>           Trace ID for queries/filtering
  --input, -i <file>        Input file for operations
  --output, -o <format>     Output format: json, ndjson, table (default: table)
  --verbose                 Verbose output
  --stop-on-error           Stop verification on first error
  --no-exec, --dry-run      Dry run mode (validate without executing)
  --help, -h                Show this help
  --version, -v             Show version

PERMISSION REQUIREMENTS:
  verify:         --allow-read
  sign:           --allow-read --allow-write --allow-env
  query:          --allow-read
  generate-keys:  (no permissions needed)
  stats:          --allow-read

EXAMPLES:
  # Verify ledger with streaming
  logline-cli verify --ledger ./data/ledger.jsonl --key abc123...
  
  # Verify with trace_id filtering and stop on first error
  logline-cli verify --trace-id "550e8400-e29b-41d4-a716-446655440000" --stop-on-error
  
  # Sign an atomic
  logline-cli sign --input atomic.json --private-key <hex> --output json
  
  # Compute hash of atomic
  logline-cli hash --input atomic.json
  
  # Generate new key pair
  logline-cli generate-keys
  
  # Query by trace ID with JSON output
  logline-cli query --trace-id "550e8400-e29b-41d4-a716-446655440000" --output json
  
  # Dry run verification
  logline-cli verify --dry-run --verbose
`)
  Deno.exit(0)
}

if (args.version) {
  console.log(VERSION)
  Deno.exit(0)
}

const ledgerPath = args.ledger || './data/ledger.jsonl'
const outputFormat = (args.output || 'table') as OutputFormat

switch (command) {
  case 'verify': {
    if (dryRun) {
      console.log('🔍 Dry run mode: would verify', ledgerPath)
      break
    }
    
    const publicKey = args.key || args['public-key'] || Deno.env.get('PUBLIC_KEY_HEX')
    const traceId = args['trace-id']
    const verifier = new LedgerVerifier(publicKey)
    
    try {
      const result = await verifier.verifyFile(ledgerPath, {
        verbose: args.verbose,
        publicKeyHex: publicKey,
        traceId,
        stopOnError: args['stop-on-error']
      })
      
      if (outputFormat === 'json') {
        console.log(JSON.stringify(result, null, 2))
      } else if (outputFormat === 'ndjson') {
        result.results.forEach(r => console.log(JSON.stringify(r)))
      }
      // Table format already printed by verifier
      
      // Exit with error if any invalid
      if (result.invalid > 0) {
        Deno.exit(1)
      }
    } catch (err) {
      exitWithError('VERIFY_ERROR', 'Verification failed', { error: String(err) })
    }
    break
  }

  case 'sign': {
    const inputFile = args.input
    if (!inputFile) {
      exitWithError('MISSING_INPUT', 'Input file required', { usage: '--input <file>' })
    }
    
    const privateKey = args['private-key'] || Deno.env.get('SIGNING_KEY_HEX')
    if (!privateKey) {
      exitWithError('MISSING_KEY', 'Private key required', { usage: '--private-key <hex> or SIGNING_KEY_HEX env var' })
    }
    
    if (dryRun) {
      console.log('🔍 Dry run mode: would sign', inputFile)
      break
    }
    
    try {
      const content = await Deno.readTextFile(inputFile)
      const atomic: Atomic = JSON.parse(content)
      
      const { hash, signature } = await signAtomic(atomic, privateKey)
      const signedAtomic = { ...atomic, hash, signature }
      
      formatOutput(signedAtomic, outputFormat)
    } catch (err) {
      exitWithError('SIGN_ERROR', 'Signing failed', { error: String(err) })
    }
    break
  }

  case 'hash': {
    const inputFile = args.input
    if (!inputFile) {
      exitWithError('MISSING_INPUT', 'Input file required', { usage: '--input <file>' })
    }
    
    try {
      const content = await Deno.readTextFile(inputFile)
      const atomic: Atomic = JSON.parse(content)
      const hash = hashAtomic(atomic)
      
      formatOutput({ hash }, outputFormat)
    } catch (err) {
      exitWithError('HASH_ERROR', 'Hashing failed', { error: String(err) })
    }
    break
  }

  case 'generate-keys': {
    const keys = generateKeyPair()
    
    if (outputFormat === 'json' || outputFormat === 'ndjson') {
      formatOutput(keys, outputFormat)
    } else {
      console.log('Generated Ed25519 Key Pair:')
      console.log('\nPrivate Key (SIGNING_KEY_HEX):')
      console.log(keys.privateKey)
      console.log('\nPublic Key (PUBLIC_KEY_HEX):')
      console.log(keys.publicKey)
      console.log('\n⚠️  Keep the private key secure! Do not commit to version control.')
    }
    break
  }

  case 'lint': {
    // Placeholder for schema validation
    console.log('📋 Linting ledger file...')
    console.log('⚠️  Not implemented yet - will validate against schema 1.1.0')
    break
  }

  case 'rotate': {
    // Placeholder for key rotation
    console.log('🔄 Key rotation...')
    console.log('⚠️  Not implemented yet - will rotate signing keys')
    break
  }

  case 'anchor': {
    // Placeholder for anchoring
    console.log('⚓ Anchoring ledger state...')
    console.log('⚠️  Not implemented yet - will anchor to blockchain/timestamping service')
    break
  }

  case 'migrate': {
    // Placeholder for migration
    console.log('🔄 Migrating ledger from v1.0 to v1.1...')
    console.log('⚠️  Not implemented yet - will migrate schema version')
    break
  }

  case 'stats': {
    if (dryRun) {
      console.log('🔍 Dry run mode: would show stats for', ledgerPath)
      break
    }
    
    try {
      const ledger = new Ledger(ledgerPath)
      const stats = await ledger.getStats()
      
      if (outputFormat === 'json') {
        formatOutput(stats, outputFormat)
      } else {
        console.log('Ledger Statistics:')
        console.log(`  Total atomics: ${stats.total}`)
        console.log('\nBy type:')
        for (const [type, count] of Object.entries(stats.by_type)) {
          console.log(`  ${type}: ${count}`)
        }
        console.log('\nBy status:')
        for (const [status, count] of Object.entries(stats.by_status)) {
          console.log(`  ${status}: ${count}`)
        }
      }
    } catch (err) {
      exitWithError('STATS_ERROR', 'Failed to get stats', { error: String(err) })
    }
    break
  }

  case 'query': {
    if (dryRun) {
      console.log('🔍 Dry run mode: would query', ledgerPath)
      break
    }
    
    const ledger = new Ledger(ledgerPath)
    const traceId = args['trace-id']
    if (!traceId) {
      exitWithError('MISSING_TRACE_ID', 'Trace ID required', { usage: '--trace-id <uuid>' })
    }
    
    try {
      const results = await ledger.query({ trace_id: traceId })
      
      if (outputFormat === 'table') {
        console.log(`Found ${results.length} atomic(s):`)
      }
      formatOutput(results, outputFormat)
    } catch (err) {
      exitWithError('QUERY_ERROR', 'Query failed', { error: String(err) })
    }
    break
  }

  default:
    exitWithError('UNKNOWN_COMMAND', `Unknown command: ${command}`, { 
      hint: 'Run with --help for usage information' 
    })
}