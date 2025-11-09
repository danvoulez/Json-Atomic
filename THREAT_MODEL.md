# Threat Model

## JSON✯Atomic Security Analysis

**Version:** 1.1.0  
**Last Updated:** 2025-11-09  
**Classification:** Public

## Executive Summary

JSON✯Atomic is a ledger-based constitutional governance platform that provides cryptographic integrity for atomic execution units. This document identifies potential threats, attack vectors, and mitigations for the system.

## System Overview

### Components

1. **Core Library** - TypeScript/Node.js module for ledger operations
2. **CLI Tools** - Command-line interface (Deno runtime)
3. **Playground** - Browser-based UI for atomic creation
4. **Ledger Storage** - Append-only NDJSON file storage
5. **Verification System** - Streaming hash and signature verification
6. **Executor** - Code execution engine (safe-by-default)

### Trust Boundaries

```
┌─────────────────────────────────────────────┐
│ External Network / Users                    │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│ Application Layer                           │
│ - Playground (Browser)                      │
│ - CLI (Deno)                                │
│ - API (if applicable)                       │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│ Core Library                                │
│ - Crypto (BLAKE3, Ed25519)                  │
│ - Canonical JSON                            │
│ - Verification                              │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│ Storage Layer                               │
│ - Filesystem (ledger.jsonl)                 │
│ - Optional: PostgreSQL, S3                  │
└─────────────────────────────────────────────┘
```

## Actors

### Legitimate Actors

1. **Observer** - Read-only access to ledger
2. **Contributor** - Can append atomics to ledger
3. **Signer** - Has private key to sign atomics
4. **Validator** - Runs verification on ledger
5. **Administrator** - Manages infrastructure and keys

### Malicious Actors

1. **External Attacker** - No system access
2. **Insider Threat** - Compromised contributor/signer
3. **Supply Chain Attacker** - Compromised dependencies
4. **Infrastructure Attacker** - Compromised hosting/cloud

## Assets & Data Classification

| Asset | Confidentiality | Integrity | Availability | Classification |
|-------|----------------|-----------|--------------|----------------|
| Private Keys | CRITICAL | CRITICAL | HIGH | SECRET |
| Ledger Data | LOW | CRITICAL | HIGH | PUBLIC |
| Source Code | LOW | HIGH | MEDIUM | PUBLIC |
| Configuration | MEDIUM | HIGH | MEDIUM | INTERNAL |
| Logs | LOW | MEDIUM | LOW | INTERNAL |

## Threat Categories

### 1. Cryptographic Threats

#### T1.1: Hash Collision Attack
- **Severity**: High
- **Description**: Attacker finds two atomics with same BLAKE3 hash
- **Impact**: Could forge atomic that verifies as different content
- **Likelihood**: Very Low (BLAKE3 has 256-bit security)
- **Mitigations**:
  - ✅ Use BLAKE3 (cryptographically secure)
  - ✅ Domain separation ("JsonAtomic/v1" context)
  - ✅ Monitor for collision reports
- **Residual Risk**: Very Low

#### T1.2: Signature Forgery
- **Severity**: Critical
- **Description**: Attacker forges Ed25519 signature
- **Impact**: Could impersonate legitimate signer
- **Likelihood**: Very Low (Ed25519 has 128-bit security)
- **Mitigations**:
  - ✅ Use Ed25519 (state-of-the-art)
  - ✅ Structured signature includes public key
  - ✅ Signatures stored with atomics for auditability
- **Residual Risk**: Very Low

#### T1.3: Key Compromise
- **Severity**: Critical
- **Description**: Private signing key stolen or leaked
- **Impact**: Attacker can sign atomics as legitimate user
- **Likelihood**: Medium
- **Mitigations**:
  - ✅ Key generation uses secure randomness
  - ✅ CLI warns against committing keys
  - ✅ Keys stored outside repository
  - ⚠️ No HSM/hardware key support (future)
  - ⚠️ No key rotation mechanism yet (placeholder)
- **Residual Risk**: Medium
- **Recommendations**:
  - Implement key rotation
  - Add HSM support for production
  - Implement key ceremony procedures

#### T1.4: Weak Randomness
- **Severity**: High
- **Description**: Predictable key generation
- **Impact**: Keys could be guessed
- **Likelihood**: Very Low
- **Mitigations**:
  - ✅ Uses `ed25519.utils.randomPrivateKey()` from @noble
  - ✅ Relies on platform CSPRNG
  - ✅ Browser uses `crypto.randomUUID()`
- **Residual Risk**: Very Low

### 2. Ledger Integrity Threats

#### T2.1: Ledger Tampering
- **Severity**: High
- **Description**: Attacker modifies existing ledger entries
- **Impact**: Historical data corrupted
- **Likelihood**: Medium (filesystem access)
- **Mitigations**:
  - ✅ Hash chains detect modifications
  - ✅ Signatures provide non-repudiation
  - ✅ Streaming verifier checks all entries
  - ⚠️ No file-level integrity (future: append-only storage)
- **Residual Risk**: Medium
- **Recommendations**:
  - Use append-only storage (e.g., WORM drives)
  - Implement anchoring to blockchain
  - Regular verification audits

#### T2.2: Fork Attack
- **Severity**: Medium
- **Description**: Attacker creates multiple chains for same trace_id
- **Impact**: Confusion about canonical chain
- **Likelihood**: Medium
- **Mitigations**:
  - ✅ Fork detection in verifier
  - ✅ Reports forks with line numbers
  - ⚠️ No automatic resolution (manual intervention)
- **Residual Risk**: Low
- **Recommendations**:
  - Implement consensus mechanism
  - Add fork resolution policies

#### T2.3: Replay Attack
- **Severity**: Low
- **Description**: Re-submit old valid atomic
- **Impact**: Duplicate entries in ledger
- **Likelihood**: Medium
- **Mitigations**:
  - ✅ Hash-based deduplication
  - ✅ Trace ID continuity checks
  - ⚠️ No timestamp validation
- **Residual Risk**: Low

#### T2.4: Genesis Violation
- **Severity**: Low
- **Description**: Invalid genesis atomic (no prev after line 1)
- **Impact**: Chain integrity unclear
- **Likelihood**: Low
- **Mitigations**:
  - ✅ Genesis rule enforced in schema
  - ✅ Verifier detects invalid genesis
- **Residual Risk**: Very Low

### 3. Denial of Service (DoS)

#### T3.1: Large Ledger Attack
- **Severity**: Medium
- **Description**: Huge ledger file exhausts memory
- **Impact**: Verification fails or OOM
- **Likelihood**: Medium
- **Mitigations**:
  - ✅ Streaming verifier (no full file load)
  - ✅ Line size limits (10MB default)
  - ✅ Configurable max line size
- **Residual Risk**: Low

#### T3.2: Malformed JSON
- **Severity**: Low
- **Description**: Invalid JSON causes parse errors
- **Impact**: Verification stopped (if --stop-on-error)
- **Likelihood**: High
- **Mitigations**:
  - ✅ Robust error handling
  - ✅ Structured error reporting
  - ✅ Continue-on-error option
- **Residual Risk**: Very Low

#### T3.3: Resource Exhaustion
- **Severity**: Medium
- **Description**: Excessive hash/signature operations
- **Impact**: CPU exhaustion
- **Likelihood**: Low
- **Mitigations**:
  - ✅ Efficient algorithms (BLAKE3, Ed25519)
  - ⚠️ No rate limiting
  - ⚠️ No process limits
- **Residual Risk**: Medium
- **Recommendations**:
  - Add rate limiting
  - Implement timeouts
  - Add resource quotas

### 4. Code Execution Threats

#### T4.1: Arbitrary Code Execution
- **Severity**: Critical
- **Description**: Attacker executes code via executor
- **Impact**: Full system compromise
- **Likelihood**: Low (safe-by-default)
- **Mitigations**:
  - ✅ Executor disabled by default
  - ✅ Requires explicit --enable-sandbox flag
  - ⚠️ Sandbox not implemented (placeholder)
  - ⚠️ No isolation guarantees
- **Residual Risk**: High (if enabled)
- **Recommendations**:
  - DO NOT enable executor in production
  - Implement proper sandboxing (WASM, isolated-vm)
  - Add policy enforcement

#### T4.2: Injection Attacks
- **Severity**: High
- **Description**: Command/SQL/code injection
- **Impact**: Unauthorized operations
- **Likelihood**: Low
- **Mitigations**:
  - ✅ No SQL database by default
  - ✅ Deno permissions restrict filesystem
  - ✅ CSP in playground prevents XSS
- **Residual Risk**: Low

### 5. Supply Chain Threats

#### T5.1: Compromised Dependencies
- **Severity**: High
- **Description**: Malicious code in npm packages
- **Impact**: Supply chain attack
- **Likelihood**: Medium
- **Mitigations**:
  - ✅ Dependabot monitors vulnerabilities
  - ✅ npm audit in CI
  - ✅ Trivy scanning
  - ✅ SBOM generation (CycloneDX)
  - ✅ Pinned versions in Docker
  - ⚠️ No signature verification on packages
- **Residual Risk**: Medium
- **Recommendations**:
  - Enable npm signature verification
  - Use Sigstore/cosign for artifacts
  - Vendor critical dependencies

#### T5.2: Build Pipeline Compromise
- **Severity**: High
- **Description**: Attacker modifies CI/CD pipeline
- **Impact**: Malicious code in releases
- **Likelihood**: Low
- **Mitigations**:
  - ✅ GitHub Actions with restricted permissions
  - ✅ CodeQL scanning
  - ✅ Branch protection rules
  - ⚠️ No artifact signing (placeholder)
  - ⚠️ No SLSA provenance
- **Residual Risk**: Medium
- **Recommendations**:
  - Implement artifact signing (cosign)
  - Add SLSA provenance
  - Use verified builders

### 6. Web Application Threats (Playground)

#### T6.1: Cross-Site Scripting (XSS)
- **Severity**: High
- **Description**: Injection of malicious scripts
- **Impact**: Session hijacking, data theft
- **Likelihood**: Low
- **Mitigations**:
  - ✅ Strict CSP headers
  - ✅ No external resources
  - ✅ React auto-escapes content
  - ✅ No `dangerouslySetInnerHTML`
- **Residual Risk**: Very Low

#### T6.2: Cross-Site Request Forgery (CSRF)
- **Severity**: Medium
- **Description**: Unauthorized actions via forged requests
- **Impact**: Unwanted atomic creation
- **Likelihood**: Low (no server)
- **Mitigations**:
  - ✅ Client-side only (no backend)
  - ✅ No authentication cookies
- **Residual Risk**: Very Low

#### T6.3: Clickjacking
- **Severity**: Low
- **Description**: Embedding in iframe for deception
- **Impact**: User performs unintended actions
- **Likelihood**: Low
- **Mitigations**:
  - ✅ X-Frame-Options: DENY
  - ✅ CSP frame-ancestors: none
- **Residual Risk**: Very Low

#### T6.4: Data Exfiltration
- **Severity**: Medium
- **Description**: Stealing user data
- **Impact**: Private keys or atomics leaked
- **Likelihood**: Low
- **Mitigations**:
  - ✅ CSP blocks unauthorized connections
  - ✅ No telemetry by default
  - ✅ Service Worker caches locally
  - ⚠️ LocalStorage could be read by extensions
- **Residual Risk**: Low

### 7. Operational Threats

#### T7.1: Key Management Failure
- **Severity**: Critical
- **Description**: Lost or inaccessible signing keys
- **Impact**: Cannot sign new atomics
- **Likelihood**: Medium
- **Mitigations**:
  - ⚠️ No key backup mechanism
  - ⚠️ No key recovery process
  - ⚠️ No key splitting/sharing
- **Residual Risk**: High
- **Recommendations**:
  - Document key backup procedures
  - Implement Shamir's Secret Sharing
  - Use hardware keys with backup

#### T7.2: Ledger Corruption
- **Severity**: High
- **Description**: Filesystem corruption or data loss
- **Impact**: Ledger unreadable
- **Likelihood**: Low
- **Mitigations**:
  - ✅ NDJSON format (line-oriented, recoverable)
  - ⚠️ No automatic backups
  - ⚠️ No replication
- **Residual Risk**: Medium
- **Recommendations**:
  - Implement automated backups
  - Add replication support
  - Test disaster recovery

#### T7.3: Configuration Error
- **Severity**: Medium
- **Description**: Misconfiguration enables vulnerabilities
- **Impact**: Security controls bypassed
- **Likelihood**: Medium
- **Mitigations**:
  - ✅ Secure defaults (executor disabled)
  - ✅ Documentation of security settings
  - ⚠️ No configuration validation
- **Residual Risk**: Medium

## Security Controls Matrix

| Control | Implemented | Effectiveness | Priority |
|---------|-------------|---------------|----------|
| Cryptographic hashing (BLAKE3) | ✅ | High | P0 |
| Digital signatures (Ed25519) | ✅ | High | P0 |
| Domain separation | ✅ | High | P0 |
| Streaming verification | ✅ | High | P0 |
| Fork detection | ✅ | Medium | P1 |
| Line size limits | ✅ | Medium | P1 |
| CSP headers | ✅ | High | P0 |
| Non-root Docker user | ✅ | Medium | P1 |
| Dependabot | ✅ | Medium | P1 |
| SBOM generation | ✅ | Low | P2 |
| Security scanning (Trivy) | ✅ | Medium | P1 |
| CodeQL analysis | ✅ | Medium | P1 |
| Key rotation | ❌ | N/A | P1 |
| HSM support | ❌ | N/A | P2 |
| Artifact signing | ❌ | N/A | P1 |
| SLSA provenance | ❌ | N/A | P2 |
| Blockchain anchoring | ❌ | N/A | P2 |
| Executor sandboxing | ❌ | N/A | P0 |

## Recommendations

### Immediate (P0)
1. **Do NOT enable executor in production** until proper sandboxing is implemented
2. Implement key rotation mechanism
3. Add comprehensive testing for security controls

### Short-term (P1)
1. Implement artifact signing (cosign)
2. Add HSM support for production keys
3. Implement rate limiting and resource quotas
4. Add ledger replication/backup automation
5. Implement executor sandboxing with proper isolation

### Long-term (P2)
1. Add SLSA provenance generation
2. Implement blockchain anchoring
3. Add cross-platform golden tests for crypto
4. Implement Shamir's Secret Sharing for keys
5. Add Byzantine fault tolerance

## Incident Response

### Key Compromise
1. Immediately revoke compromised key
2. Generate new key pair
3. Re-sign affected atomics
4. Audit ledger for unauthorized entries
5. Notify affected parties

### Ledger Tampering
1. Stop all writes to ledger
2. Restore from last known good backup
3. Run full verification with --stop-on-error
4. Investigate scope of tampering
5. Implement additional controls

### Supply Chain Incident
1. Pin all dependencies to last known good versions
2. Audit code changes
3. Rebuild from source with verified dependencies
4. Update SBOM
5. Communicate with users

## Compliance & Standards

- **GDPR**: Ledger data is public; no PII should be stored
- **SOC 2**: Logging and monitoring recommendations provided
- **NIST CSF**: Aligns with Identify, Protect, Detect, Respond, Recover
- **CIS Controls**: Implements inventory (SBOM), secure config, access control

## Review Schedule

This threat model should be reviewed:
- **Quarterly**: Regular security review
- **On major version changes**: After significant features
- **After incidents**: Post-incident analysis
- **On new threat intelligence**: Industry vulnerabilities

---

**Last Reviewed**: 2025-11-09  
**Next Review**: 2026-02-09  
**Reviewers**: Security Team, Core Maintainers
