# Migration Guide: v1.0.0 → v1.1.0

This guide helps you migrate from JSON✯Atomic v1.0.0 to v1.1.0.

## Overview

Version 1.1.0 introduces **breaking changes** to improve security, determinism, and production readiness. The main changes affect:

1. Schema structure (fields moved/renamed)
2. Signature format (string → structured object)
3. Hash computation (added domain separation)
4. Type definitions alignment

## Breaking Changes

### 1. Schema Version Field

**Before (v1.0.0):**
```json
{
  "entity_type": "file",
  "this": "example"
}
```

**After (v1.1.0):**
```json
{
  "schema_version": "1.1.0",
  "entity_type": "file",
  "this": "example"
}
```

**Action Required:**
- Add `"schema_version": "1.1.0"` to all atomics
- This field is **required** in v1.1.0

### 2. Trace ID Location

**Before (v1.0.0):**
```json
{
  "metadata": {
    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**After (v1.1.0):**
```json
{
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Action Required:**
- Move `trace_id` from `metadata.trace_id` to top-level `trace_id`
- `metadata.trace_id` is **no longer supported**

### 3. Hash Field Renamed

**Before (v1.0.0):**
```json
{
  "curr_hash": "a1b2c3d4..."
}
```

**After (v1.1.0):**
```json
{
  "hash": "a1b2c3d4..."
}
```

**Action Required:**
- Rename `curr_hash` to `hash`
- Update all code references

### 4. Signature Structure

**Before (v1.0.0):**
```json
{
  "signature": "abc123def456..."
}
```

**After (v1.1.0):**
```json
{
  "signature": {
    "alg": "Ed25519",
    "public_key": "def456abc123...",
    "sig": "abc123def456...",
    "signed_at": "2024-01-01T00:00:00Z"
  }
}
```

**Action Required:**
- Convert signature string to structured object
- Include algorithm and public key
- Optionally include signing timestamp

### 5. DID Structure

**Before (v1.0.0):**
```json
{
  "did": "did:example:user"
}
```

**After (v1.1.0):**
```json
{
  "did": {
    "actor": "did:example:user",
    "action": "create",
    "reason": "Initial creation"
  }
}
```

**Action Required:**
- Convert DID string to object with `actor` and `action`
- `reason` field is optional

### 6. Hash Computation

**Before (v1.0.0):**
```typescript
const hash = blake3(canonicalJson)
```

**After (v1.1.0):**
```typescript
const hash = blake3(canonicalJson, { context: 'JsonAtomic/v1' })
```

**Important:** This means **hashes will change** for the same atomic!

**Action Required:**
- Recompute all hashes using domain separation
- Old hashes are **not compatible** with new verification

## Migration Steps

### Step 1: Backup Your Data

```bash
# Backup existing ledger
cp data/ledger.jsonl data/ledger.jsonl.v1.0.0.backup
```

### Step 2: Update Dependencies

```bash
npm install logline-core@1.1.0
# or
cd playground && npm install
```

### Step 3: Migrate Ledger Data

Use this migration script (save as `migrate.js`):

```javascript
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { createReadStream, createWriteStream } from 'fs';

async function migrateLedger(inputPath, outputPath) {
  const input = createReadStream(inputPath);
  const output = createWriteStream(outputPath);
  const rl = createInterface({ input });
  
  for await (const line of rl) {
    const old = JSON.parse(line);
    
    // Migrate to v1.1.0 format
    const migrated = {
      schema_version: '1.1.0',
      entity_type: old.entity_type,
      this: old.this,
      trace_id: old.metadata?.trace_id,
      
      // Convert DID
      did: typeof old.did === 'string' 
        ? { actor: old.did, action: 'migrate' }
        : old.did,
      
      // Rename hash field
      hash: old.curr_hash,
      
      // Convert signature if present
      ...(old.signature && typeof old.signature === 'string'
        ? {
            signature: {
              alg: 'Ed25519',
              public_key: 'NEEDS_MANUAL_FILL', // Must be filled manually
              sig: old.signature
            }
          }
        : old.signature && { signature: old.signature }
      ),
      
      // Keep other fields
      ...Object.fromEntries(
        Object.entries(old).filter(([k]) => 
          !['curr_hash', 'signature', 'did', 'metadata'].includes(k)
        )
      ),
      
      // Update metadata
      metadata: old.metadata 
        ? Object.fromEntries(
            Object.entries(old.metadata).filter(([k]) => k !== 'trace_id')
          )
        : undefined
    };
    
    output.write(JSON.stringify(migrated) + '\n');
  }
  
  output.end();
  console.log('Migration complete!');
}

// Run migration
migrateLedger('data/ledger.jsonl', 'data/ledger.v1.1.0.jsonl');
```

**Run migration:**
```bash
node migrate.js
```

### Step 4: Re-sign Atomics

Since hash computation changed, you need to re-sign all atomics:

```bash
# Generate new keys or use existing
deno run --allow-env --allow-read --allow-write \
  tools/cli/logline-cli.ts generate-keys

# Sign each atomic (example for single file)
deno run --allow-read --allow-write --allow-env \
  tools/cli/logline-cli.ts sign \
  --input atomic.json \
  --private-key YOUR_PRIVATE_KEY \
  --output json > atomic-signed.json
```

### Step 5: Verify Migration

```bash
# Verify new ledger
deno run --allow-read --allow-env \
  tools/cli/logline-cli.ts verify \
  --ledger data/ledger.v1.1.0.jsonl \
  --key YOUR_PUBLIC_KEY \
  --verbose
```

### Step 6: Update Application Code

**TypeScript/JavaScript:**

```diff
// Import updated types
- import type { Atomic } from 'logline-core'
+ import type { Atomic, Signature } from 'logline-core'

// Update atomic creation
const atomic: Atomic = {
+  schema_version: '1.1.0',
   entity_type: 'file',
   this: 'example',
-  did: 'did:example:user',
+  did: {
+    actor: 'did:example:user',
+    action: 'create'
+  },
-  metadata: {
-    trace_id: uuid(),
+  trace_id: uuid(),
+  metadata: {
     created_at: new Date().toISOString()
   }
}

// Update hash computation
import { hashAtomic } from 'logline-core/crypto'
- const hash = hashAtomic(atomic) // old
+ const hash = hashAtomic(atomic) // automatically uses domain separation

// Update signature handling
- if (atomic.signature && typeof atomic.signature === 'string') {
-   // old string signature
- }
+ if (atomic.signature?.alg === 'Ed25519') {
+   const publicKey = atomic.signature.public_key
+   const sig = atomic.signature.sig
+ }
```

## Code Changes Summary

### Core Module

| File | Change |
|------|--------|
| `types.ts` | Added `Signature`, `LedgerError` types |
| `core/crypto.ts` | Domain-separated BLAKE3, structured signatures |
| `core/canonical.ts` | Documented canonicalization strategy |
| `core/ledger/verifyLedger.ts` | Streaming verification |

### Playground

| File | Change |
|------|--------|
| `playground/src/lib/jsonatomic.ts` | Updated all types and functions |
| `playground/index.html` | Added CSP, removed Google Fonts |

### CLI

| Command | Change |
|---------|--------|
| `verify` | Added streaming, fork detection |
| `sign` | New command for signing |
| `hash` | New command for hashing |

## Rollback Plan

If you need to rollback:

```bash
# Restore backup
cp data/ledger.jsonl.v1.0.0.backup data/ledger.jsonl

# Downgrade
npm install logline-core@1.0.0
```

## Known Issues

1. **Public Keys in Signatures**: The migration script cannot automatically fill public keys for old signatures. You must either:
   - Re-sign all atomics with the new format
   - Manually add public keys to migrated signatures

2. **Hash Changes**: All hashes will be different due to domain separation. This means:
   - Chain links (`prev`) must be updated
   - External references by hash will break

3. **Type Compatibility**: Old JSON files may not pass v1.1.0 schema validation until migrated

## Getting Help

- **Issues**: https://github.com/danvoulez/JsonAtomic/issues
- **Discussions**: https://github.com/danvoulez/JsonAtomic/discussions
- **Documentation**: https://github.com/danvoulez/JsonAtomic/blob/main/README.md

## Testing Checklist

After migration, verify:

- [ ] All atomics have `schema_version: "1.1.0"`
- [ ] `trace_id` is at top level, not in metadata
- [ ] `hash` field (not `curr_hash`)
- [ ] Signatures are structured objects (if signed)
- [ ] `did` is an object with `actor` and `action`
- [ ] Ledger verifies successfully
- [ ] Application code builds without errors
- [ ] Tests pass
- [ ] Playground loads and works correctly

## Timeline

- **v1.0.0 Support**: Until 2025-12-31
- **v1.1.0 Release**: 2025-11-09
- **Recommended Migration**: Before 2025-12-01

After 2025-12-31, v1.0.0 format will no longer be supported in new features or bug fixes.
