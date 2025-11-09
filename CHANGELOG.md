# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-11-09

### 🎉 Major Features

#### Schema & Type System
- **BREAKING**: Updated atomic schema to version 1.1.0
- Added `schema_version` field (const: "1.1.0")
- **BREAKING**: Changed `signature` from string to structured object with `{ alg, public_key, sig, signed_at }`
- Added `hash` field alongside `curr_hash` for forward compatibility
- Added genesis rule: first atomic must not have `prev`, subsequent atomics must have `prev`
- Aligned `entity_type` enum: added "test" type
- Aligned `intent` enum for consistent action types
- Enhanced `Did` interface with proper `actor` and `action` structure
- Exported new types: `Signature`, `SignedAtomic`, `LedgerError`

#### Cryptography
- **BREAKING**: Implemented domain-separated BLAKE3 hashing with context "JsonAtomic/v1"
- Updated `signAtomic()` to return structured signatures
- Updated `verifySignature()` to accept signatures from atomic object (no separate public key needed)
- Enhanced canonicalization with detailed RFC 8785 documentation
- Added Known Answer Test (KAT) support for reproducible hashes

#### Ledger Verification
- **BREAKING**: Rewrote `verifyLedger` with streaming (line-by-line) for memory efficiency
- Added `prev` chain validation to detect broken chains
- Added structured error reporting with `{ line, code, message, trace_id }`
- Added line size limits (10MB max per line)
- Added `--trace-id` filtering with fork detection
- Enhanced verification to support both old and new signature formats
- Programmatic API export for `VerificationResult`, `ChainState`

#### CLI Enhancements
- Added new commands:
  - `sign` - Sign an atomic from JSON file
  - `hash` - Calculate hash of an atomic
  - `lint` - Validate atomic structure
  - `migrate` - Placeholder for format migration (1.0.0 → 1.1.0)
- Added `--output=json|ndjson|table` for flexible output formats
- Added structured error codes (e.g., `VERIFY_ERROR`, `SIGN_ERROR`, `MISSING_ARGUMENT`)
- Added `--no-exec` / dry-run mode
- Added `--check-prev-chain` flag for chain validation
- Added `--stop-on-error` flag
- Documented minimal Deno permissions per command
- Enhanced help text with examples and permission requirements

#### Executor & Policies
- **BREAKING**: Made executor safe-by-default (no execution without `--enable-sandbox`)
- Added policy enforcement framework:
  - `TTL` - Time-to-live validation
  - `Throttle` - Rate limiting with sliding window
  - `Circuit Breaker` - Fault tolerance pattern
  - `Slow Run` - Maximum duration enforcement
- Added `validateLawTest()` for `entity_type=law` + `intent=law_test`
- Added error/success tracking for circuit breakers

#### Playground
- Added strict Content Security Policy (CSP)
- Removed external Google Fonts dependency
- Added self-hosted font instructions
- Added Service Worker for offline-first support
- Updated to use structured signatures
- Updated to use domain-separated BLAKE3 hashing
- Maintained accessibility (A11y) with semantic HTML

#### CI/CD & Supply Chain
- Added SBOM generation (CycloneDX format)
- Added vulnerability scanning (Trivy)
- Added Dependabot configuration for automated dependency updates
- Enhanced CodeQL security scanning
- Added artifact uploads for SBOM and security reports
- Grouped dependency updates for easier management

#### Docker
- Pinned base image to `node:20.10.0-alpine`
- Created dedicated non-root user `jsonatomic` (uid/gid 1001)
- Added read-only permissions for application files
- Added `dumb-init` for proper signal handling
- Optimized memory usage with `--max-old-space-size=512`
- Added security labels and metadata
- Added proper file ownership and permissions (550 for app, 770 for data)

### 🔧 Technical Improvements

- Enhanced canonicalization documentation (RFC 8785 comparison)
- Added Unicode NFC normalization notes
- Improved error messages throughout the codebase
- Added TypeScript strict mode compliance
- Enhanced type safety with proper exports

### 📚 Documentation

- Added `CHANGELOG.md` (this file)
- Added `MIGRATION.md` with upgrade guide
- Added `THREAT_MODEL.md` for security analysis
- Added `OPERATIONS.md` for production operations
- Added font self-hosting instructions
- Enhanced README with 1.1.0 features

### 🐛 Bug Fixes

- Fixed TypeScript isolated modules errors
- Fixed streaming verification memory issues
- Fixed signature verification with both old and new formats

### ⚠️ Breaking Changes

1. **Signature Format**: Signatures are now objects, not strings
   - Old: `{ signature: "abc123..." }`
   - New: `{ signature: { alg: "Ed25519", public_key: "...", sig: "...", signed_at: "..." } }`

2. **Hash Context**: BLAKE3 now uses domain separation
   - Hashes computed with 1.1.0 will differ from 1.0.0 due to context "JsonAtomic/v1"

3. **Executor Default**: Code execution now disabled by default
   - Must use `--enable-sandbox` flag to enable execution

4. **Schema Version**: New required (or recommended) `schema_version` field

See `MIGRATION.md` for detailed upgrade instructions.

## [1.0.0] - 2024-XX-XX

### Initial Release

- Basic atomic schema and type system
- BLAKE3 hashing and Ed25519 signatures
- Ledger verification
- CLI tools (verify, generate-keys, stats, query)
- Basic executor and contract validation
- Playground for browser-based interaction
- CI/CD pipeline with testing and deployment
- Docker support

[1.1.0]: https://github.com/danvoulez/JsonAtomic/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/danvoulez/JsonAtomic/releases/tag/v1.0.0
