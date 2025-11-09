# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-09

### 🎯 Major Release - Production Hardening & Security Enhancement

This release brings JSON✯Atomic to production-grade quality with comprehensive security hardening, cryptographic improvements, enhanced developer experience, and a premium playground UI.

### Added

#### Playground UI/UX
- **Premium design system** with CSS custom properties for theming
- **Dark/light mode toggle** with smooth transitions
- **Responsive 2-column layout** (XL screens: Editor | Sidebar)
- **Custom Monaco themes** (jsonatomic-dark and jsonatomic-light)
- **Tailwind CSS integration** with custom brand colors (#6E56CF purple theme)
- **Accessible components** with focus-visible states and ARIA labels
- **System font stack** - no external dependencies (fully self-hosted)
- **Animation effects** - fade-in and smooth transitions
- **Custom scrollbar styling** matching theme
- **CSP-compliant** - all resources served from same origin

#### Schema & Types
- **Schema version 1.1.0** with strict validation rules
- `schema_version` field (required, const "1.1.0")
- `trace_id` as top-level UUID field (moved from metadata.trace_id)
- `hash` field with 64-character hex pattern validation
- Structured `signature` object with `$defs.Signature`:
  - `alg`: Algorithm identifier (Ed25519)
  - `public_key`: Hex-encoded public key (64 chars)
  - `sig`: Hex-encoded signature (128 chars)
  - `signed_at`: Optional timestamp
- **Genesis rule**: Only first atomic can omit `prev` field
- `LedgerError` type for structured error reporting
- `SignedAtomic` type for signed atomics

#### Cryptography
- **Domain separation** in BLAKE3 hashing with context "JsonAtomic/v1"
- Deterministic hash computation with canonicalized JSON
- Structured signature objects replacing simple hex strings
- Enhanced signature verification with public key extraction
- **Enhanced canonicalization documentation** with Unicode NFC normalization guidelines
- **Known Answer Tests (KATs)** for reproducible crypto verification
- Known limitations documented (Unicode normalization must be done by caller, floating-point edge cases)
- Examples and best practices for cross-platform compatibility

#### Ledger Verifier
- **Streaming verification** - processes large ledgers line-by-line without memory exhaustion
- Chain validation - verifies `prev` hash links within file
- Genesis validation - ensures only first atomic lacks `prev`
- Fork detection - identifies multiple chains for same `trace_id`
- Line size limits (10MB default) with overflow protection
- Structured error codes:
  - `LINE_TOO_LARGE`: Line exceeds size limit
  - `MISSING_HASH`: Hash field missing
  - `HASH_MISMATCH`: Computed hash differs from stored
  - `CHAIN_BROKEN`: Previous hash doesn't match
  - `INVALID_GENESIS`: Genesis atomic found after line 1
  - `FORK_DETECTED`: Multiple chains for trace_id
  - `INVALID_SIGNATURE_ALG`: Invalid signature algorithm
  - `INVALID_SIGNATURE`: Signature verification failed
  - `NO_PUBLIC_KEY`: Cannot verify without public key
  - `PARSE_ERROR`: JSON parsing error

#### CLI Enhancements
- New commands:
  - `sign` - Sign atomic with private key
  - `hash` - Compute hash of atomic
  - `lint` - Validate against schema (placeholder)
  - `rotate` - Key rotation (placeholder)
  - `anchor` - Blockchain anchoring (placeholder)
  - `migrate` - Schema migration (placeholder)
- **Output formats**: `--output json|ndjson|table`
- **Dry run mode**: `--no-exec` / `--dry-run` for validation
- **Trace ID filtering**: `--trace-id` for targeted verification
- **Stop on error**: `--stop-on-error` flag
- Structured error reporting with error codes
- Permission documentation per command
- Version bumped to 1.1.0

#### Playground
- **Content Security Policy** (CSP) headers
  - `default-src 'self'`
  - Blocked external resources
  - Restricted script execution
- **Self-hosted fonts** - removed Google Fonts dependency
- **Service Worker** for offline-first functionality
- Updated library to use structured signatures
- Domain-separated BLAKE3 hashing
- Enhanced validation for signature structure
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)

#### CI/CD & Supply Chain
- **SBOM generation** with CycloneDX format
- **Trivy security scanning** with SARIF output
- **Dependabot configuration** for automated dependency updates:
  - Core dependencies (npm)
  - Playground dependencies (npm)
  - GitHub Actions
  - Docker images
- Enhanced CodeQL configuration
- Weekly dependency checks
- Grouped minor/patch updates

#### Docker
- **Pinned base image** versions (node:20.18.1-alpine3.20)
- **Non-root user** (jsonatomic:jsonatomic, UID/GID 1001)
- **OCI labels** for metadata
- Instructions for read-only filesystem usage
- Reproducible builds with npm ci
- Minimal attack surface

### Changed

#### Breaking Changes
- `curr_hash` renamed to `hash` throughout codebase
- `metadata.trace_id` moved to top-level `trace_id`
- `signature` changed from string to structured object:
  ```diff
  - "signature": "abc123..."
  + "signature": {
  +   "alg": "Ed25519",
  +   "public_key": "def456...",
  +   "sig": "abc123...",
  +   "signed_at": "2025-11-09T07:00:00Z"
  + }
  ```
- `did` changed from string to object:
  ```diff
  - "did": "did:example:user"
  + "did": {
  +   "actor": "did:example:user",
  +   "action": "create"
  + }
  ```
- Schema requires `schema_version: "1.1.0"`

#### Improvements
- Canonicalization documented with RFC 8785 comparison
- Verifier uses readline instead of readFileSync
- All atomic references use consistent field names
- Enhanced type safety with strict TypeScript
- Better error messages with structured codes

### Deprecated
- Old signature string format (use structured object)
- `metadata.trace_id` location (use top-level `trace_id`)
- `curr_hash` field name (use `hash`)

### Removed
- Google Fonts from playground
- External dependencies from playground CSP
- Memory-unsafe ledger reading (readFileSync)

### Fixed
- Memory exhaustion on large ledger files
- Inconsistent hash computation across implementations
- Missing domain separation in cryptographic hashing
- Lack of chain validation in verifier
- Missing security headers in playground

### Security
- Domain-separated hashing prevents cross-protocol attacks
- Structured signatures include public key for verification
- CSP prevents XSS and injection attacks
- Non-root Docker user limits privilege escalation
- SBOM enables vulnerability tracking
- Trivy scanning detects dependency vulnerabilities
- Line size limits prevent DoS attacks
- Fork detection prevents chain manipulation

### Migration Guide
See [MIGRATION.md](./MIGRATION.md) for detailed upgrade instructions from v1.0.0 to v1.1.0.

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Basic atomic schema
- Ed25519 signatures
- BLAKE3 hashing
- Ledger append and query
- CLI tools
- Browser playground
- Docker support
- CI/CD pipeline

---

[1.1.0]: https://github.com/danvoulez/JsonAtomic/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/danvoulez/JsonAtomic/releases/tag/v1.0.0
