# Json✯Atomic

**Ledger-only constitutional governance platform**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Security](https://img.shields.io/badge/security-0%20vulnerabilities-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## ✨ Recent Improvements

**Phases 1-4 Complete!** - Comprehensive technical improvements implemented:

- ✅ **TypeScript Strict Mode** - Full type safety
- ✅ **Domain-Driven Design** - Clean architecture
- ✅ **Security Hardening** - 0 vulnerabilities
- ✅ **Result Pattern** - Functional error handling
- ✅ **Repository Pattern** - Abstract data access
- ✅ **Observability** - Logging, metrics, tracing, health checks
- ✅ **Testing** - 135+ tests with high coverage

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) and [TECHNICAL_IMPROVEMENTS.md](./TECHNICAL_IMPROVEMENTS.md) for details.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Configuration

```bash
# Copy example environment file
cp .env.example .env

# Generate cryptographic keys
deno run -A tools/cli/logline-cli.ts generate-keys

# Edit .env with your configuration
```

### Build

```bash
npm run build
```

### CLI Usage (Deno)

```bash
# Verify ledger integrity
deno run -A tools/cli/logline-cli.ts verify

# Show statistics
deno run -A tools/cli/logline-cli.ts stats

# Generate Ed25519 keys
deno run -A tools/cli/logline-cli.ts generate-keys
```

### API Usage (Deno)

```bash
# Start REST API
export API_KEY=your-secret-key
deno run -A api/restApi.ts
```

## 🏗️ Architecture

```
core/
├── domain/              # Pure business logic
│   ├── Result.ts        # Functional error handling
│   ├── errors/          # Domain error hierarchy
│   └── value-objects/   # Immutable value types (Hash, Cursor, TraceId)
├── application/         # Use cases & workflows
│   └── use-cases/
├── infrastructure/      # External concerns
│   └── repositories/    # Data access abstraction
├── canonical.ts         # Deterministic JSON serialization
├── crypto.ts            # Ed25519 + BLAKE3
├── ledger/             # Ledger implementations
└── config/             # Configuration system
```

## 🔐 Security

- ✅ **0 Vulnerabilities** - CodeQL verified
- ✅ **No Hardcoded Secrets** - Environment-based config
- ✅ **Cryptographic Security** - Ed25519 + BLAKE3
- ✅ **Input Validation** - Zod schemas + Value objects
- ✅ **Type Safety** - Strict TypeScript mode

## 📚 Documentation

- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Executive overview
- [Technical Improvements](./TECHNICAL_IMPROVEMENTS.md) - Detailed changelog
- [API Documentation](./docs/README.md) - API reference
- [Configuration Guide](./.env.example) - Environment variables

## 🧪 Features

### Core Features
- ✅ Append-only ledger with JSONL format
- ✅ BLAKE3 hashing for integrity
- ✅ Ed25519 signatures for authenticity
- ✅ Ledger verification and rotation
- ✅ Query by trace_id, entity_type, tenant_id
- ✅ Pagination support

### Architecture Features
- ✅ Domain-Driven Design
- ✅ Result pattern for errors
- ✅ Repository pattern for data access
- ✅ Value objects (immutable, self-validating)
- ✅ Use cases layer for business logic

## 📊 Status

**Phase 1: Foundation** ✅ Complete  
**Phase 2: DDD & Repository Pattern** ✅ Complete  
**Phase 3: Observability** ✅ Complete  
**Phase 4: Testing** ✅ Complete  
**Phase 5: API & Documentation** ✅ Complete  
**Phase 6: DevOps & CI/CD** ✅ Complete  

🎉 **All Phases Complete!**

## 🎮 Playground

Experience Json✯Atomic in action with our **browser-based playground**!

👉 **[Launch Playground](https://danvoulez.github.io/JsonAtomic/)** _(coming soon)_

Features:
- ✨ Monaco Editor (VSCode-like experience)
- 🔐 Cryptographic operations (BLAKE3, Ed25519)
- 📝 Interactive atomic creation and validation
- 🎨 Beautiful dark theme
- 💻 Runs 100% in your browser - no server needed!

## 🐳 Docker

```bash
# Quick start with Docker
docker-compose up -d

# Or build and run
docker build -t jsonatomic .
docker run -p 8000:8000 -p 9090:9090 jsonatomic
```

## 📚 API Documentation

- [OpenAPI Specification](./docs/api/openapi.yaml)
- [API Reference](./docs/README.md)
- Interactive API docs available at `/docs` when running the server

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [🎮 Playground](https://danvoulez.github.io/JsonAtomic/) - Interactive browser playground
- [📖 API Documentation](./docs/api/openapi.yaml) - OpenAPI specification
- [🐛 Issue Tracker](https://github.com/danvoulez/JsonAtomic/issues)
- [📋 Technical Plan](./TECHNICAL_IMPROVEMENTS.md)
- [📚 Documentation](./docs/README.md)
