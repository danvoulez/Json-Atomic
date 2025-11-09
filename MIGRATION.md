# Migration Guide: 1.0.0 → 1.1.0

This guide helps you upgrade from JsonAtomic 1.0.0 to 1.1.0.

## Overview of Changes

Version 1.1.0 introduces several breaking changes to improve security, determinism, and production-readiness:

1. **Structured Signatures** - Signatures are now objects instead of strings
2. **Domain-Separated Hashing** - BLAKE3 uses context for hash isolation
3. **Safe-by-Default Executor** - Code execution requires explicit flag
4. **Enhanced Schema** - New fields and validation rules

## Breaking Changes

### 1. Signature Format Change

**Before (1.0.0):**
```json
{
  "entity_type": "function",
  "this": "/example",
  "did": { "actor": "user@example.com", "action": "create" },
  "metadata": { "trace_id": "...", "created_at": "..." },
  "curr_hash": "abc123...",
  "signature": "def456..."
}
```

**After (1.1.0):**
```json
{
  "schema_version": "1.1.0",
  "entity_type": "function",
  "this": "/example",
  "did": { "actor": "user@example.com", "action": "create" },
  "metadata": { "trace_id": "...", "created_at": "..." },
  "hash": "abc123...",
  "signature": {
    "alg": "Ed25519",
    "public_key": "deadbeef...",
    "sig": "cafe1234...",
    "signed_at": "2024-11-09T00:00:00Z"
  }
}
```

**Migration Steps:**

1. If you have existing signed atomics, they remain valid for verification (backward compatible)
2. For new atomics, use the updated `signAtomic()` function:

```typescript
// Old
const signed = await signAtomic(atomic, privateKey)
// Returns: { curr_hash: "...", signature: "..." }

// New
const signed = await signAtomic(atomic, privateKey)
// Returns: { ...atomic, hash: "...", signature: { alg, public_key, sig, signed_at } }
```

3. Update verification code:

```typescript
// Old
verifySignature(atomic, publicKeyHex)

// New
verifySignature(atomic) // Public key is now in signature.public_key
```

### 2. Domain-Separated BLAKE3 Hashing

**Impact:** Hashes computed with 1.1.0 will differ from 1.0.0

**Before:**
```typescript
const hash = blake3(canonicalize(atomic))
```

**After:**
```typescript
const hash = blake3(canonicalize(atomic), { context: 'JsonAtomic/v1' })
```

**Migration Steps:**

1. Existing hashes remain valid for historical verification
2. New atomics will have different hashes due to domain separation
3. **DO NOT** re-hash existing ledger entries - they are immutable
4. Use `migrate` command (when available) to annotate schema version without changing hashes

**Why this change?**
- Prevents hash collisions between different uses of BLAKE3
- Improves cryptographic hygiene
- Aligns with BLAKE3 best practices

### 3. Safe-by-Default Executor

**Before:**
```typescript
const executor = new AtomicExecutor()
await executor.execute(atomic) // Would attempt execution
```

**After:**
```typescript
const executor = new AtomicExecutor() // Default: disabled
await executor.execute(atomic) // Returns error

const sandboxedExecutor = new AtomicExecutor({ enableSandbox: true })
await sandboxedExecutor.execute(atomic) // Execution allowed
```

**Migration Steps:**

1. Review all code that uses `CodeExecutor` or `AtomicExecutor`
2. Add `{ enableSandbox: true }` if execution is intended
3. Implement proper sandboxing (WASM, isolated-vm, etc.) for production

### 4. Enhanced Schema Validation

**New Required Field (Recommended):**
```json
{
  "schema_version": "1.1.0"
}
```

**New Validation Rules:**

1. **Genesis Rule**: First atomic must NOT have `prev`, others MUST have `prev`
2. **DID Structure**: Must be object with `actor` and `action` (was string in old code)
3. **Entity Types**: Added "test" to enum
4. **Intent Types**: Standardized enum values

**Migration Steps:**

1. Add `schema_version: "1.1.0"` to new atomics
2. Update `did` field if stored as string:
   ```json
   // Old
   "did": "user@example.com:create"
   
   // New
   "did": {
     "actor": "user@example.com",
     "action": "create"
   }
   ```

3. Validate against new schema:
   ```bash
   logline-cli lint atomic.json
   ```

## CLI Changes

### New Commands

```bash
# Sign an atomic
logline-cli sign atomic.json --private-key <hex>

# Calculate hash
logline-cli hash atomic.json

# Lint/validate
logline-cli lint atomic.json
```

### Enhanced Verify

```bash
# Old
logline-cli verify --ledger ledger.jsonl --key <pubkey>

# New (with chain validation)
logline-cli verify --ledger ledger.jsonl \
  --check-prev-chain \
  --trace-id <uuid> \
  --output json
```

### Output Formats

```bash
# Table (default, human-readable)
logline-cli verify --output table

# JSON (single object)
logline-cli verify --output json

# NDJSON (newline-delimited, one per line)
logline-cli verify --output ndjson
```

## Ledger Verification Changes

### Streaming Verification

**Before:** Loaded entire file into memory
```typescript
const verifier = new LedgerVerifier()
await verifier.verifyFile('ledger.jsonl')
```

**After:** Streams line-by-line (memory efficient)
```typescript
const verifier = new LedgerVerifier()
await verifier.verifyFile('ledger.jsonl', {
  checkPrevChain: true,  // NEW: validate chain integrity
  traceId: 'uuid',       // NEW: filter by trace
  stopOnError: true      // NEW: fail fast
})
```

**Benefits:**
- Can verify large ledgers (GBs) without OOM
- Detects chain breaks and forks
- Structured error reporting

## Playground Changes

### CSP and Self-Hosted Fonts

**Action Required:**

1. Download JetBrains Mono fonts:
   ```bash
   cd playground/public/fonts
   # Follow instructions in README.md
   ```

2. CSP is now strict - no external resources allowed
3. Service Worker added for offline support

### Updated API

```typescript
// Old
import { signAtomic } from './lib/jsonatomic'
const signed = signAtomic(atomic, privateKey)
signed.signature // string

// New
import { signAtomic } from './lib/jsonatomic'
const signed = signAtomic(atomic, privateKey)
signed.signature.sig // string within structured object
signed.signature.public_key // public key included
```

## Policy Enforcement

New policy validation methods:

```typescript
import { ContractValidator } from './core/contracts/validator'

const validator = new ContractValidator()

// TTL check
const ttlResult = validator.enforceTTL(atomic, 3600)

// Throttle check
const throttleResult = validator.enforceThrottle('key', 100, 60)

// Circuit breaker
const cbResult = validator.enforceCircuitBreaker('service', 5, 300)
```

## Docker Changes

**Before:**
```dockerfile
FROM node:20-alpine
USER node
```

**After:**
```dockerfile
FROM node:20.10.0-alpine  # Pinned version
USER jsonatomic            # Dedicated user
ENTRYPOINT ["dumb-init", "--"]
```

**Migration:**
- Update docker-compose.yml to use new user if needed
- Update volume permissions: `chown 1001:1001 data/`

## Testing Your Migration

1. **Validate Schema:**
   ```bash
   logline-cli lint atomic.json
   ```

2. **Verify Signatures:**
   ```bash
   logline-cli verify --ledger ledger.jsonl --check-prev-chain
   ```

3. **Test Signing:**
   ```bash
   logline-cli sign atomic.json --private-key $KEY --output json
   ```

4. **Run Tests:**
   ```bash
   npm test
   deno test --allow-all tests/
   ```

## Rollback Plan

If you encounter issues:

1. **Tag your current state:**
   ```bash
   git tag pre-1.1.0-migration
   ```

2. **Keep 1.0.0 version available:**
   ```bash
   npm install logline-core@1.0.0
   ```

3. **Verify old ledgers remain readable:**
   - 1.1.0 verifier supports old signature format
   - Hashes will differ for new atomics only

## Getting Help

- **Issues**: https://github.com/danvoulez/JsonAtomic/issues
- **Discussions**: https://github.com/danvoulez/JsonAtomic/discussions
- **Documentation**: See `OPERATIONS.md` and `THREAT_MODEL.md`

## Timeline Recommendation

1. **Week 1**: Update dev environment, run tests
2. **Week 2**: Migrate non-production systems
3. **Week 3**: Test in staging with production data
4. **Week 4**: Deploy to production

Take your time - backward compatibility is maintained for verification.
