#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parse } from "https://deno.land/std/flags/mod.ts"
import { Ledger } from '../../core/ledger/ledger.ts'
import { LedgerVerifier } from '../../core/ledger/verifyLedger.ts'
import { canonicalize } from '../../core/canonical.ts'
import { signAtomic, generateKeyPair } from '../../core/crypto.ts'

const VERSION = '1.0.0'

const args = parse(Deno.args, {
  string: ['ledger', 'key', 'trace-id'],
  boolean: ['help', 'version', 'verbose'],
  alias: {
    h: 'help',
    v: 'version',
    l: 'ledger',
    k: 'key',
  },
})

const command = args._[0] as string

if (args.help || !command) {
  console.log(`
LogLineOS CLI v${VERSION}

USAGE:
  logline-cli [command] [options]

COMMANDS:
  verify              Verify ledger integrity
  append <file>       Append atomic from JSON file
  query               Query atomics by trace_id
  generate-keys       Generate new Ed25519 key pair
  stats               Show ledger statistics

OPTIONS:
  --ledger, -l <path>    Ledger file path (default: ./data/ledger.jsonl)
  --key, -k <hex>        Public key for verification
  --trace-id <id>        Trace ID for queries
  --verbose              Verbose output
  --help, -h             Show this help
  --version, -v          Show version

EXAMPLES:
  logline-cli verify --ledger ./data/ledger.jsonl --key abc123...
  logline-cli generate-keys
  logline-cli stats
`)
  Deno.exit(0)
}

if (args.version) {
  console.log(VERSION)
  Deno.exit(0)
}

const ledgerPath = args.ledger || './data/ledger.jsonl'

switch (command) {
  case 'verify': {
    const publicKey = args.key || Deno.env.get('PUBLIC_KEY_HEX')
    const verifier = new LedgerVerifier(publicKey)
    await verifier.verifyFile(ledgerPath, {
      verbose: args.verbose,
      publicKeyHex: publicKey,
    })
    break
  }

  case 'generate-keys': {
    const keys = generateKeyPair()
    console.log('Generated Ed25519 Key Pair:')
    console.log('\nPrivate Key (SIGNING_KEY_HEX):')
    console.log(keys.privateKey)
    console.log('\nPublic Key (PUBLIC_KEY_HEX):')
    console.log(keys.publicKey)
    console.log('\n⚠️  Keep the private key secure! Do not commit to version control.')
    break
  }

  case 'stats': {
    const ledger = new Ledger(ledgerPath)
    const stats = await ledger.getStats()
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
    break
  }

  case 'query': {
    const ledger = new Ledger(ledgerPath)
    const traceId = args['trace-id']
    if (!traceId) {
      console.error('Error: --trace-id required')
      Deno.exit(1)
    }
    const results = await ledger.query({ trace_id: traceId })
    console.log(`Found ${results.length} atomic(s):`)
    console.log(JSON.stringify(results, null, 2))
    break
  }

  default:
    console.error(`Unknown command: ${command}`)
    console.error('Run with --help for usage information')
    Deno.exit(1)
}