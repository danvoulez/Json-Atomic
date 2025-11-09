# JsonAtomic 1.1.0 Release Notes

**Release Date**: 2024-11-09  
**Version**: 1.1.0  
**Type**: Minor (SemVer) - Production Hardening Release

---

## 🎯 Executive Summary

JsonAtomic 1.1.0 is a production-ready hardening release that significantly enhances security, scalability, and operational capabilities while maintaining backward compatibility for verification.

**Key Improvements:**
- 🔒 Enhanced cryptographic security with domain separation
- ⚡ Memory-efficient streaming verification
- 🛡️ Safe-by-default execution model
- 📊 Comprehensive operational documentation
- 🏗️ Production-grade containerization

---

## 🔥 Highlights

### Security Enhancements

**Domain-Separated BLAKE3 Hashing**
- Implements BLAKE3 with context "JsonAtomic/v1"
- Prevents hash collision attacks across different use cases
- Aligns with cryptographic best practices

**Structured Signatures**
- Ed25519 signatures now include:
  - Algorithm identifier (`alg: "Ed25519"`)
  - Public key (embedded, no separate key needed)
  - Signature bytes
  - Timestamp (`signed_at`)
- Prevents public key substitution attacks
- Enables self-contained verification

**Safe-by-Default Executor**
- Code execution disabled unless explicitly enabled
- Requires `--enable-sandbox` flag
- Prevents accidental code execution in production

### Scalability Improvements

**Streaming Ledger Verification**
- Line-by-line processing (no more loading entire file into memory)
- Handles GB-sized ledgers efficiently
- 10MB line size limit prevents DOS attacks

**Chain Validation**
- Validates `prev` field chain integrity
- Detects broken chains and missing atomics
- Identifies forks for same `trace_id`

### Developer Experience

**Enhanced CLI**
- New commands: `sign`, `hash`, `lint`
- Multiple output formats: `json`, `ndjson`, `table`
- Structured error codes for programmatic handling
- Dry-run mode (`--no-exec`) for validation

**Comprehensive Documentation**
- Migration guide (1.0.0 → 1.1.0)
- Threat model (15 security threats analyzed)
- Operations manual (production deployment)
- Complete changelog

---

## 📦 What's New

### Schema v1.1.0

```json
{
  "schema_version": "1.1.0",
  "entity_type": "function",
  "this": "/example",
  "did": {
    "actor": "user@example.com",
    "action": "create"
  },
  "metadata": {
    "trace_id": "uuid-v4",
    "created_at": "2024-11-09T00:00:00Z"
  },
  "hash": "abc123...",
  "signature": {
    "alg": "Ed25519",
    "public_key": "deadbeef...",
    "sig": "cafe1234...",
    "signed_at": "2024-11-09T00:00:00Z"
  }
}
```

### New CLI Commands

```bash
# Sign an atomic
logline-cli sign atomic.json --private-key <hex> --output json

# Calculate hash
logline-cli hash atomic.json

# Validate structure
logline-cli lint atomic.json

# Verify with chain validation
logline-cli verify --ledger ledger.jsonl --check-prev-chain

# Query with filtering
logline-cli query --trace-id <uuid> --output ndjson
```

### Policy Enforcement

```typescript
import { ContractValidator } from './core/contracts/validator'

const validator = new ContractValidator()

// TTL check (time-to-live)
validator.enforceTTL(atomic, 3600) // 1 hour

// Throttle (rate limiting)
validator.enforceThrottle('user:123', 100, 60) // 100 calls per minute

// Circuit breaker
validator.enforceCircuitBreaker('service:api', 5, 300) // 5 errors, 5 min timeout

// Slow run (max duration)
validator.enforceSlowRun(duration_ms, 30000) // 30 second max
```

---

## ⚠️ Breaking Changes

### 1. Signature Format

**Old (1.0.0):**
```json
{
  "curr_hash": "abc123...",
  "signature": "def456..."
}
```

**New (1.1.0):**
```json
{
  "hash": "abc123...",
  "signature": {
    "alg": "Ed25519",
    "public_key": "deadbeef...",
    "sig": "cafe1234...",
    "signed_at": "2024-11-09T00:00:00Z"
  }
}
```

**Migration**: Old signatures remain verifiable. New atomics use structured format.

### 2. Hash Computation

**Old:** `BLAKE3(canonical)`  
**New:** `BLAKE3(canonical, context="JsonAtomic/v1")`

**Impact**: Hashes differ between versions.  
**Migration**: DO NOT re-hash existing atomics. Use schema version to distinguish.

### 3. Executor Default

**Old:** Execution attempted (stub implementation)  
**New:** Execution disabled by default

**Migration**: Add `{ enableSandbox: true }` if execution is intended.

---

## 📊 Metrics

### Files Changed
- **Core**: 5 files (canonical, crypto, verifier, executor, validator)
- **CLI**: 1 file (enhanced with new commands)
- **Schema**: 1 file (v1.1.0 with structured signatures)
- **Types**: 1 file (aligned with schema)
- **Playground**: 2 files (CSP, structured signatures)
- **Infrastructure**: 3 files (Dockerfile, CI/CD, Dependabot)
- **Documentation**: 5 files (CHANGELOG, MIGRATION, THREAT_MODEL, OPERATIONS, README)

### Lines of Code
- **Added**: ~3,500 lines
- **Modified**: ~500 lines
- **Removed**: ~200 lines
- **Documentation**: ~39,000 characters

### Build Status
- ✅ TypeScript compilation successful
- ✅ No type errors
- ✅ Strict mode enabled
- ✅ All exports validated

---

## 🔗 Links

- **CHANGELOG**: [CHANGELOG.md](./CHANGELOG.md)
- **Migration Guide**: [MIGRATION.md](./MIGRATION.md)
- **Threat Model**: [THREAT_MODEL.md](./THREAT_MODEL.md)
- **Operations Manual**: [OPERATIONS.md](./OPERATIONS.md)
- **GitHub Repository**: https://github.com/danvoulez/JsonAtomic
- **Issues**: https://github.com/danvoulez/JsonAtomic/issues

---

## 🚀 Upgrade Instructions

### Quick Upgrade

```bash
# 1. Update package
npm install logline-core@1.1.0

# 2. Generate new keys (optional, for new signatures)
logline-cli generate-keys

# 3. Verify existing ledger (backward compatible)
logline-cli verify --ledger ledger.jsonl --check-prev-chain

# 4. Update code to use new types
import type { Signature, SignedAtomic } from 'logline-core'
```

### Detailed Migration

See **[MIGRATION.md](./MIGRATION.md)** for:
- Step-by-step upgrade process
- Code migration examples
- Rollback procedures
- Testing checklist

---

## 🙏 Acknowledgments

This release implements comprehensive production hardening based on security best practices and operational requirements.

Special thanks to:
- BLAKE3 team for the cryptographic hash function
- Ed25519 (RFC 8032) specification authors
- RFC 8785 (JCS) for canonicalization guidance
- @noble libraries for cryptographic primitives

---

## 📅 Timeline

- **2024-11-09**: Version 1.1.0 released
- **2024-11**: Migration period (1.0.0 → 1.1.0)
- **2024-12**: Full 1.1.0 adoption recommended

---

## 🔮 Future Roadmap

**Planned for 1.2.0:**
- [ ] Multi-signature support
- [ ] Hardware Security Module (HSM) integration
- [ ] Anchoring to external ledgers (Bitcoin, Ethereum)
- [ ] Full RFC 8785 (JCS) compliance
- [ ] Property-based testing suite
- [ ] Cross-language test vectors (TypeScript ↔ Rust)

**Planned for 2.0.0:**
- [ ] Breaking: Full Unicode NFC normalization
- [ ] Breaking: Strict RFC 8785 canonicalization
- [ ] Zero-knowledge proof support
- [ ] Distributed ledger consensus

---

## 📞 Support

- **Documentation**: See docs/ directory
- **Issues**: https://github.com/danvoulez/JsonAtomic/issues
- **Discussions**: https://github.com/danvoulez/JsonAtomic/discussions
- **Security**: See THREAT_MODEL.md for security contacts

---

**Happy shipping! 🚢**

*JsonAtomic Team*  
*November 2024*
