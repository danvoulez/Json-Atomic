# Threat Model

This document analyzes security threats to JsonAtomic/LogLineOS and mitigation strategies.

## System Overview

JsonAtomic is a ledger-based system for recording and verifying atomic execution units with cryptographic signatures. It consists of:

- **Core**: Hashing (BLAKE3), signing (Ed25519), canonicalization
- **Ledger**: Append-only NDJSON file with chain validation
- **CLI**: Command-line tools for signing, verification, querying
- **Executor**: Sandboxed (or disabled) code execution
- **Playground**: Browser-based UI for building and validating atomics
- **API**: REST/WebSocket interfaces (if deployed)

## Trust Boundaries

1. **Cryptographic Boundary**: Signed atomics vs unsigned
2. **Network Boundary**: Internal services vs external clients
3. **Execution Boundary**: Trusted code vs user-supplied code
4. **Storage Boundary**: File system vs external storage (S3, etc.)
5. **Browser Boundary**: Playground (client-side) vs server

## Threat Actors

### External Attackers
- **Capabilities**: Network access, can submit atomics, read public data
- **Goals**: Data corruption, unauthorized execution, DoS, information disclosure
- **Mitigation**: Signature verification, rate limiting, input validation

### Malicious Insiders
- **Capabilities**: Access to signing keys, can create valid atomics
- **Goals**: Insert malicious atomics, exfiltrate data, cover tracks
- **Mitigation**: Multi-sig (future), audit trails, key rotation, access logs

### Compromised Dependencies
- **Capabilities**: Code execution in build/runtime environment
- **Goals**: Supply chain attack, backdoor insertion
- **Mitigation**: SBOM, dependency scanning, pinned versions, signature verification

### Accidental Misuse
- **Capabilities**: Legitimate users making mistakes
- **Goals**: N/A (unintentional)
- **Mitigation**: Safe defaults, validation, dry-run modes, clear documentation

## Threats and Mitigations

### T1: Hash Collision Attack

**Threat**: Attacker creates two different atomics with the same hash

**Impact**: Critical - breaks integrity verification

**Likelihood**: Very Low (BLAKE3 is collision-resistant)

**Mitigation**:
- Use BLAKE3 (cryptographically strong)
- Domain separation with context "JsonAtomic/v1"
- Canonical JSON ensures determinism
- Monitor for hash algorithm vulnerabilities

**Residual Risk**: Low - requires breaking BLAKE3

---

### T2: Signature Forgery

**Threat**: Attacker creates valid signature without private key

**Impact**: Critical - breaks authentication

**Likelihood**: Very Low (Ed25519 is secure)

**Mitigation**:
- Ed25519 signatures (FIPS 186-5 approved)
- Structured signatures include public key (no key substitution)
- Key rotation support
- Hardware Security Module (HSM) support (future)

**Residual Risk**: Low - requires breaking Ed25519

---

### T3: Key Compromise

**Threat**: Private signing key is stolen or leaked

**Impact**: Critical - all future atomics can be forged

**Likelihood**: Medium (human error, insider threat)

**Mitigation**:
- Key rotation mechanisms
- Environment variables (not hardcoded)
- `.gitignore` for key files
- Multi-signature support (future)
- Hardware token support (future)
- Key access logging

**Detection**:
- Monitor for unexpected signing activity
- Anomaly detection on atomic patterns
- Regular key rotation audits

**Response**:
- Immediate key rotation
- Revocation mechanism (mark compromised key in ledger)
- Forensic analysis of affected atomics

**Residual Risk**: Medium - depends on operational security

---

### T4: Ledger Tampering

**Threat**: Attacker modifies ledger file directly

**Impact**: High - corrupts audit trail

**Likelihood**: Low to Medium (depends on deployment)

**Mitigation**:
- File system permissions (read-only for most users)
- Cryptographic signatures on each atomic
- Prev-chain validation detects modifications
- Immutable storage (S3 Object Lock, WORM drives)
- Regular integrity checks

**Detection**:
- Hash verification fails
- Prev-chain breaks
- Signature verification fails

**Response**:
- Restore from backup
- Identify point of corruption
- Re-verify entire chain

**Residual Risk**: Low with proper file permissions and signatures

---

### T5: Replay Attack

**Threat**: Attacker replays valid signed atomics

**Impact**: Medium - duplicate operations

**Likelihood**: Medium

**Mitigation**:
- Unique `trace_id` (UUID) per atomic
- `created_at` timestamp
- Nonce or sequence numbers (future)
- Application-level deduplication

**Detection**:
- Duplicate `trace_id` detection
- Timestamp anomalies

**Residual Risk**: Medium - requires application-level checks

---

### T6: Chain Reorganization (Fork Attack)

**Threat**: Attacker creates alternative chain from earlier point

**Impact**: High - creates conflicting histories

**Likelihood**: Low (requires key access)

**Mitigation**:
- Prev-chain validation
- Fork detection in verifier
- Anchoring to external ledger (Bitcoin, Ethereum) - future
- Timestamping service

**Detection**:
- Multiple chains for same trace_id
- Prev hash mismatches
- `--check-prev-chain` flag

**Response**:
- Identify canonical chain
- Reject or quarantine forks
- Investigate source of fork

**Residual Risk**: Low with chain validation

---

### T7: Denial of Service (DoS)

**Threat**: Attacker floods system with atomics or verification requests

**Impact**: Medium - service degradation

**Likelihood**: Medium to High

**Mitigation**:
- Rate limiting (throttle policy)
- Circuit breakers
- Line size limits (10MB max)
- Streaming verification (memory efficient)
- API authentication and quotas

**Detection**:
- Monitoring metrics (request rate, memory usage)
- Alert thresholds

**Response**:
- Block malicious IPs
- Increase rate limits for legitimate users
- Scale infrastructure

**Residual Risk**: Medium - volumetric attacks hard to prevent

---

### T8: Code Injection via Executor

**Threat**: Malicious code in atomic payload executes arbitrary commands

**Impact**: Critical - full system compromise

**Likelihood**: High if executor enabled

**Mitigation**:
- **Safe-by-default**: Executor disabled unless `--enable-sandbox`
- Sandboxing (WASM, isolated-vm, vm2)
- No file system or network access by default
- Policy-based execution limits (CPU, memory, time)
- Allowlist of permitted operations

**Detection**:
- Unexpected process spawning
- File system modifications
- Network connections

**Response**:
- Kill process
- Quarantine atomic
- Audit similar atomics

**Residual Risk**: High - sandboxing not yet implemented

**Status**: 1.1.0 disables execution by default; sandbox implementation is TODO

---

### T9: Side-Channel Attacks

**Threat**: Timing or power analysis reveals secrets

**Impact**: Medium - key extraction

**Likelihood**: Low (requires physical or network proximity)

**Mitigation**:
- Use constant-time crypto operations (Ed25519 library handles this)
- Avoid timing-dependent logic
- Rate limiting masks timing

**Residual Risk**: Low - relies on library implementation

---

### T10: Supply Chain Attack

**Threat**: Compromised dependency injects malicious code

**Impact**: Critical - backdoor in production

**Likelihood**: Low to Medium

**Mitigation**:
- **SBOM**: CycloneDX generation in CI
- **Dependency scanning**: Trivy, npm audit
- **Pinned versions**: package-lock.json
- **Dependabot**: Automated updates with review
- **Minimal dependencies**: Only @noble, zod, pino
- **Signature verification**: Check npm packages (future)

**Detection**:
- SBOM comparison (before/after)
- Hash verification of packages
- Behavioral anomalies

**Response**:
- Rollback to known-good version
- Audit affected systems
- Report to npm security

**Residual Risk**: Medium - zero-day in dependencies

---

### T11: Cross-Site Scripting (XSS) in Playground

**Threat**: Malicious atomic payload displays XSS in browser

**Impact**: Medium - client-side compromise

**Likelihood**: Low (CSP mitigates)

**Mitigation**:
- **Content Security Policy (CSP)**: strict policy, no inline scripts
- Input sanitization
- React's automatic escaping
- No `dangerouslySetInnerHTML`

**Residual Risk**: Low with CSP

---

### T12: Man-in-the-Middle (MITM) on API

**Threat**: Attacker intercepts/modifies API traffic

**Impact**: High - data corruption, credential theft

**Likelihood**: Medium (if TLS not enforced)

**Mitigation**:
- **TLS 1.3** for all API endpoints
- Certificate pinning (mobile clients)
- HSTS headers
- `upgrade-insecure-requests` CSP directive

**Residual Risk**: Low with proper TLS

---

### T13: Ledger Rollback Attack

**Threat**: Attacker reverts ledger to earlier state

**Impact**: High - loss of recent atomics

**Likelihood**: Low (requires file system access)

**Mitigation**:
- File system permissions
- Immutable storage (append-only)
- Backup and replication
- Timestamps and prev-chain validation

**Detection**:
- Missing recent atomics
- Prev-chain breaks

**Response**:
- Restore from backup
- Investigate access logs

**Residual Risk**: Low with immutable storage

---

### T14: Canonicalization Inconsistency

**Threat**: Different implementations produce different canonical forms

**Impact**: High - hash mismatches, verification failures

**Likelihood**: Medium (cross-language implementations)

**Mitigation**:
- **Documentation**: RFC 8785 comparison in code
- **Test vectors**: Known Answer Tests (KATs)
- **Cross-lang tests**: TypeScript vs Rust (future)
- Unicode normalization (NFC) - documented for future

**Residual Risk**: Medium - requires strict testing

---

### T15: Policy Bypass

**Threat**: Attacker evades throttle, TTL, or circuit breaker

**Impact**: Medium - resource abuse

**Likelihood**: Medium

**Mitigation**:
- Server-side policy enforcement
- Stateful tracking (not client-side)
- Persistent storage for throttle state
- Clock synchronization (NTP)

**Detection**:
- Policy violations logged
- Anomaly detection

**Residual Risk**: Medium - determined attacker may find bypass

---

## Security Checklist

### Deployment

- [ ] Use environment variables for keys (`SIGNING_KEY_HEX`, `PUBLIC_KEY_HEX`)
- [ ] Enable file system encryption at rest
- [ ] Use read-only file system for Docker containers
- [ ] Drop all Linux capabilities (`--cap-drop=ALL`)
- [ ] Run as non-root user (`jsonatomic` user in Docker)
- [ ] Enable audit logging (file access, signing operations)
- [ ] Configure rate limiting and throttling
- [ ] Set up monitoring and alerting
- [ ] Regular key rotation schedule
- [ ] Backup strategy (daily encrypted backups)

### Development

- [ ] Keep dependencies up to date (Dependabot)
- [ ] Review SBOM regularly
- [ ] Run CodeQL and Trivy scans
- [ ] Sign commits with GPG
- [ ] Code review all changes
- [ ] Test with malicious inputs
- [ ] Fuzz testing (future)
- [ ] Property-based testing (fast-check)

### Operations

- [ ] Incident response plan
- [ ] Key compromise procedure
- [ ] Backup and restore testing
- [ ] Access control reviews
- [ ] Security training for team
- [ ] Penetration testing (annual)
- [ ] Bug bounty program (future)

## Security Contacts

- **Report vulnerabilities**: security@loglineos.dev (when available)
- **GitHub Security Advisories**: https://github.com/danvoulez/JsonAtomic/security/advisories

## References

- BLAKE3 specification: https://github.com/BLAKE3-team/BLAKE3-specs
- Ed25519 (RFC 8032): https://tools.ietf.org/html/rfc8032
- RFC 8785 (JCS): https://tools.ietf.org/html/rfc8785
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CWE Top 25: https://cwe.mitre.org/top25/

## Changelog

- **2024-11-09**: Initial threat model for v1.1.0
