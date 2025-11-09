#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parse } from "https://deno.land/std/flags/mod.ts"
import { Ledger } from '../../core/ledger/ledger.ts'
import { LedgerVerifier } from '../../core/ledger/verifyLedger.ts'
import { canonicalize } from '../../core/canonical.ts'
import { signAtomic, generateKeyPair, hashAtomic } from '../../core/crypto.ts'

const VERSION = '1.1.0'

type OutputFormat = 'json' | 'ndjson' | 'table'

const args = parse(Deno.args, {
  string: ['ledger', 'key', 'trace-id', 'output', 'private-key', 'public-key', 'file'],
  boolean: ['help', 'version', 'verbose', 'no-exec', 'check-prev-chain', 'stop-on-error'],
  alias: {
    h: 'help',
    v: 'version',
    l: 'ledger',
    k: 'key',
    o: 'output',
  },
  default: {
    output: 'table'
  }
})

const command = args._[0] as string

/**
 * Output formatter
 */
function formatOutput(data: any, format: OutputFormat): void {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(data, null, 2))
      break
    case 'ndjson':
      if (Array.isArray(data)) {
        data.forEach(item => console.log(JSON.stringify(item)))
      } else {
        console.log(JSON.stringify(data))
      }
      break
    case 'table':
      // Default console output (already formatted)
      break
  }
}

/**
 * Error handler with structured codes
 */
function exitWithError(code: string, message: string, details?: any): never {
  const error = {
    code,
    message,
    details
  }
  
  if (args.output === 'json' || args.output === 'ndjson') {
    console.error(JSON.stringify(error))
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
LogLineOS CLI v${VERSION}

USAGE:
  logline-cli [command] [options]

COMMANDS:
  verify              Verify ledger integrity (streaming, memory-efficient)
  sign <file>         Sign an atomic from JSON file
  hash <file>         Calculate hash of an atomic
  generate-keys       Generate new Ed25519 key pair
  stats               Show ledger statistics
  query               Query atomics by trace_id
  lint                Validate atomic structure against schema
  migrate             Migrate ledger from old format to 1.1.0
  
OPTIONS:
  --ledger, -l <path>      Ledger file path (default: ./data/ledger.jsonl)
  --key, -k <hex>          Public key for verification
  --private-key <hex>      Private key for signing
  --trace-id <id>          Filter by trace ID
  --output, -o <format>    Output format: json|ndjson|table (default: table)
  --check-prev-chain       Validate prev field chain in verify
  --stop-on-error          Stop verification on first error
  --no-exec                Dry-run mode (validate without executing)
  --verbose                Verbose output
  --help, -h               Show this help
  --version, -v            Show version

EXAMPLES:
  # Verify ledger with streaming and chain validation
  logline-cli verify --ledger ./data/ledger.jsonl --check-prev-chain --verbose
  
  # Verify with specific public key and JSON output
  logline-cli verify --key abc123... --output json
  
  # Sign an atomic
  logline-cli sign atomic.json --private-key <hex> --output json
  
  # Generate keys
  logline-cli generate-keys
  
  # Query by trace ID with JSON output
  logline-cli query --trace-id <uuid> --output json

PERMISSIONS:
  verify:         --allow-read
  sign:           --allow-read --allow-write --allow-env
  generate-keys:  (no special permissions)
  query:          --allow-read
  stats:          --allow-read
`)
  Deno.exit(0)
}

if (args.version) {
  console.log(VERSION)
  Deno.exit(0)
}

const ledgerPath = args.ledger || './data/ledger.jsonl'
const outputFormat = args.output as OutputFormat

// Dry-run check
if (args['no-exec']) {
  console.log('🔍 Dry-run mode: validating command without execution')
  console.log(`Command: ${command}`)
  console.log(`Options:`, args)
  Deno.exit(0)
}

switch (command) {
  case 'verify': {
    const publicKey = args.key || args['public-key'] || Deno.env.get('PUBLIC_KEY_HEX')
    const verifier = new LedgerVerifier(publicKey)
    
    try {
      const result = await verifier.verifyFile(ledgerPath, {
        verbose: args.verbose || outputFormat === 'table',
        publicKeyHex: publicKey,
        traceId: args['trace-id'],
        checkPrevChain: args['check-prev-chain'],
        stopOnError: args['stop-on-error']
      })
      
      if (outputFormat !== 'table') {
        formatOutput(result, outputFormat)
      }
      
      // Exit with error code if any invalid
      if (result.invalid > 0) {
        Deno.exit(1)
      }
    } catch (error) {
      exitWithError('VERIFY_ERROR', 'Failed to verify ledger', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    break
  }

  case 'sign': {
    const filePath = args.file || args._[1] as string
    if (!filePath) {
      exitWithError('MISSING_ARGUMENT', 'File path required for sign command')
    }
    
    const privateKey = args['private-key'] || Deno.env.get('SIGNING_KEY_HEX')
    if (!privateKey) {
      exitWithError('MISSING_KEY', 'Private key required (use --private-key or SIGNING_KEY_HEX env var)')
    }
    
    try {
      const content = await Deno.readTextFile(filePath)
      const atomic = JSON.parse(content)
      
      const signed = await signAtomic(atomic, privateKey)
      
      formatOutput(signed, outputFormat)
    } catch (error) {
      exitWithError('SIGN_ERROR', 'Failed to sign atomic', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    break
  }

  case 'hash': {
    const filePath = args.file || args._[1] as string
    if (!filePath) {
      exitWithError('MISSING_ARGUMENT', 'File path required for hash command')
    }
    
    try {
      const content = await Deno.readTextFile(filePath)
      const atomic = JSON.parse(content)
      
      const hash = hashAtomic(atomic)
      
      formatOutput({ hash }, outputFormat)
    } catch (error) {
      exitWithError('HASH_ERROR', 'Failed to calculate hash', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
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

  case 'stats': {
    try {
      const ledger = new Ledger(ledgerPath)
      const stats = await ledger.getStats()
      
      if (outputFormat === 'json' || outputFormat === 'ndjson') {
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
    } catch (error) {
      exitWithError('STATS_ERROR', 'Failed to get statistics', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    break
  }

  case 'query': {
    const traceId = args['trace-id']
    if (!traceId) {
      exitWithError('MISSING_ARGUMENT', '--trace-id required for query command')
    }
    
    try {
      const ledger = new Ledger(ledgerPath)
      const results = await ledger.query({ trace_id: traceId })
      
      if (outputFormat === 'json' || outputFormat === 'ndjson') {
        formatOutput(results, outputFormat)
      } else {
        console.log(`Found ${results.length} atomic(s):`)
        console.log(JSON.stringify(results, null, 2))
      }
    } catch (error) {
      exitWithError('QUERY_ERROR', 'Failed to query ledger', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    break
  }

  case 'lint': {
    const filePath = args.file || args._[1] as string
    if (!filePath) {
      exitWithError('MISSING_ARGUMENT', 'File path required for lint command')
    }
    
    try {
      const content = await Deno.readTextFile(filePath)
      const atomic = JSON.parse(content)
      
      // Basic validation
      const errors: string[] = []
      
      if (!atomic.entity_type) errors.push('Missing required field: entity_type')
      if (!atomic.this) errors.push('Missing required field: this')
      if (!atomic.did) errors.push('Missing required field: did')
      if (!atomic.metadata?.trace_id) errors.push('Missing required field: metadata.trace_id')
      if (!atomic.metadata?.created_at) errors.push('Missing required field: metadata.created_at')
      
      const result = {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      }
      
      if (outputFormat === 'json' || outputFormat === 'ndjson') {
        formatOutput(result, outputFormat)
      } else {
        if (result.valid) {
          console.log('✅ Atomic is valid')
        } else {
          console.log('❌ Atomic has errors:')
          errors.forEach(err => console.log(`  - ${err}`))
        }
      }
      
      if (!result.valid) {
        Deno.exit(1)
      }
    } catch (error) {
      exitWithError('LINT_ERROR', 'Failed to lint atomic', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    break
  }

  case 'migrate': {
    console.log('⚠️  Migrate command not yet implemented')
    console.log('This command will migrate ledger from 1.0.0 to 1.1.0 format')
    console.log('Changes: signature string → signature object')
    Deno.exit(1)
    break
  }

  case 'rotate':
  case 'anchor': {
    console.log(`⚠️  ${command} command not yet implemented`)
    Deno.exit(1)
    break
  }

  default:
    exitWithError('UNKNOWN_COMMAND', `Unknown command: ${command}`, {
      hint: 'Run with --help for usage information'
    })
}
