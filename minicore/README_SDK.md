# @logline/minicore 🚀

**Minicore** is a portable, embeddable runtime for executing JSON✯Atomic spans with secure sandboxed execution, policy enforcement, cryptographic signing, and auditable logging.

[![npm version](https://img.shields.io/npm/v/@logline/minicore.svg)](https://www.npmjs.com/package/@logline/minicore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is Minicore?

Minicore is the **local instance of a universal runtime** for JSON✯Atomic spans. Each span is an event, contract, or computational intention that can be executed safely, audited, and verified.

### Key Features

- ✅ **Secure Execution** - Sandboxed code execution with configurable timeouts
- 🔐 **Cryptographic Signing** - BLAKE3 hashing + Ed25519 signatures (DV25Seal)
- 📝 **Policy Enforcement** - TTL, slow detection, throttle, circuit breaker
- 🔧 **Loadable Kernels** - `run_code`, `evaluate_prompt`, `apply_policy`
- 📊 **Auditable Logs** - Complete execution history with NDJSON export
- 🌐 **Multi-Platform** - Works in Deno, Node.js, browsers, and edge runtimes
- 🎮 **Playground Mode** - Interactive experimentation with spans

## 📦 Installation

### Deno (Recommended)

```typescript
import { Minicore } from 'https://deno.land/x/minicore/src/sdk.ts'
```

### npm

```bash
npm install @logline/minicore
```

```typescript
import { Minicore } from '@logline/minicore'
```

### From Source

```bash
git clone https://github.com/danvoulez/Json-Atomic.git
cd Json-Atomic/minicore
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { Minicore } from '@logline/minicore'

// Create instance (auto-generates keypair)
const minicore = new Minicore()

// Execute a simple code span
const result = await minicore.execute({
  kind: 'run_code',
  input: {
    code: 'return 2 + 2'
  }
})

console.log(result.output)     // 4
console.log(result.status)     // "ok"
console.log(result.hash)       // BLAKE3 hash
console.log(result.signature)  // Ed25519 signature
```

### With Context Variables

```typescript
const result = await minicore.execute({
  kind: 'run_code',
  input: {
    code: 'return greeting + " " + name',
    context: {
      greeting: 'Hello',
      name: 'World'
    }
  }
})

console.log(result.output)  // "Hello World"
```

### Policy Enforcement

```typescript
const result = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return Date.now()' },
  policy: {
    ttl: '5m',      // Reject if span > 5 minutes old
    slow: '100ms'   // Mark if execution > 100ms
  }
})

console.log(result.policy_applied)  // ['ttl', 'slow']
```

## 📚 Core Concepts

### Spans

A **span** is a JSON object representing a computational unit:

```typescript
interface Span {
  type: string              // e.g., "execution"
  kind?: string             // e.g., "run_code"
  input?: object            // Kernel-specific input
  output?: unknown          // Execution result
  status?: 'pending' | 'ok' | 'error'
  duration_ms?: number      // Execution time
  logs?: string[]           // Execution logs
  span_id?: string          // Unique identifier
  trace_id?: string         // Trace correlation
  policy?: object           // Policy config
  meta?: object             // Metadata
}
```

### Kernels

Kernels are execution engines for different span types:

#### `run_code` - Execute JavaScript

```typescript
await minicore.execute({
  kind: 'run_code',
  input: {
    code: 'return Math.sqrt(16)',
    timeout: 1000  // ms
  }
})
```

#### `evaluate_prompt` - LLM Integration (Stub)

```typescript
await minicore.execute({
  kind: 'evaluate_prompt',
  input: {
    prompt: 'Explain quantum computing',
    model: 'gpt-4',
    temperature: 0.7
  }
})
```

#### `apply_policy` - Policy Enforcement

```typescript
await minicore.execute({
  kind: 'apply_policy',
  input: {
    ttl: '10m',
    slow: '50ms'
  }
})
```

### Policies

Policies are computational rules applied to spans:

- **`ttl`** - Time to live (reject old spans)
- **`slow`** - Mark slow executions
- **`throttle`** - Rate limiting (requires state)
- **`circuit_breaker`** - Circuit breaker pattern (requires state)

### Signatures

All executions are automatically signed with:
- **BLAKE3** for hashing (with domain separation)
- **Ed25519** for digital signatures

```typescript
const result = await minicore.execute({ ... })

// Verify signature
const isValid = minicore.verify(result)
console.log(isValid)  // true
```

## 🧪 Advanced Usage

### Loading Spans

```typescript
import { loadFromJSON, loadFromFile, loadFromURL } from '@logline/minicore'

// From JSON string
const span = loadFromJSON('{"type":"execution","kind":"run_code",...}')

// From file (Deno only)
const span = await loadFromFile('./span.json')

// From URL
const span = await loadFromURL('https://example.com/span.json')

// From NDJSON
const spans = loadFromNDJSON(ndjsonString)
```

### Dry Run Mode

```typescript
const minicore = new Minicore({ dry_run: true })

const result = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return "validated but not executed"' }
})

// Code is validated but not executed
console.log(result.output)  // "Syntax valid (dry run)"
```

### NDJSON Export

```typescript
// Execute multiple spans
await minicore.execute({ kind: 'run_code', input: { code: 'return 1' } })
await minicore.execute({ kind: 'run_code', input: { code: 'return 2' } })
await minicore.execute({ kind: 'run_code', input: { code: 'return 3' } })

// Export all as NDJSON
const ndjson = minicore.exportNDJSON()

// Save to file (Deno)
await Deno.writeTextFile('audit-log.ndjson', ndjson)
```

### Playground Mode

```typescript
import { createPlayground } from '@logline/minicore'

const playground = createPlayground()

await playground.code('return 2 + 2')
await playground.code('return Math.PI')
await playground.prompt('Explain JSON✯Atomic')

console.log(playground.history())  // All executions
console.log(playground.export())   // NDJSON export
playground.clear()                  // Clear history
```

### Custom Configuration

```typescript
const minicore = new Minicore({
  privateKey: 'your-private-key-hex',
  publicKey: 'your-public-key-hex',
  timeout: 5000,     // 5 second default timeout
  dry_run: false
})
```

## 🌐 Environment Support

Minicore is designed to run anywhere:

### ✅ Supported Environments

- **Deno** - Full support (recommended)
- **Browser** - Full support (no file system)
- **Node.js** - Full support (18+)
- **Cloudflare Workers** - Compatible
- **Deno Deploy** - Compatible
- **Bun** - Compatible

### Browser Usage

Bundle with esbuild or similar:

```bash
npm install -D esbuild
npx esbuild node_modules/@logline/minicore/src/sdk.ts --bundle --format=esm --outfile=minicore.js
```

Then use in HTML:

```html
<script type="module">
  import { Minicore } from './minicore.js'
  
  const minicore = new Minicore()
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return "Hello from browser!"' }
  })
  console.log(result.output)
</script>
```

## 📖 API Reference

### Class: `Minicore`

#### Constructor

```typescript
new Minicore(config?: MinicoreConfig)
```

#### Methods

- `execute(span: Partial<Span>): Promise<ExecutionResult>`
- `verify(signedSpan: SignedSpan): boolean`
- `exportNDJSON(): string`
- `getHistory(): ExecutionResult[]`
- `clearHistory(): void`
- `getConfig(): MinicoreConfig`

### Functions

- `runSpan(span, config?)` - Execute a span in one call
- `createPlayground(config?)` - Create interactive playground
- `generateKeyPair()` - Generate Ed25519 keypair
- `hashSpan(span)` - Hash span with BLAKE3
- `signSpan(span, privateKey)` - Sign span
- `verifySpan(span, publicKey?)` - Verify signature
- `validateSpan(span)` - Validate span structure
- `createSpan(partial)` - Create span with defaults
- `loadFromJSON(json)` - Load span from JSON
- `loadFromFile(path)` - Load span from file
- `loadFromURL(url)` - Load span from URL
- `getRuntime()` - Detect runtime environment

## 🔒 Security

### Sandbox Limitations

The current sandbox uses JavaScript's `Function` constructor for isolation. This is suitable for **trusted code only**.

For production use with untrusted code, consider:
- **Web Workers** (browser)
- **Deno permissions** (Deno)
- **isolated-vm** (Node.js)

### Cryptography

- **BLAKE3** - Fast, secure hashing with domain separation
- **Ed25519** - Industry-standard digital signatures
- **Deterministic canonicalization** - Reproducible hashes

### Best Practices

1. Always validate input spans
2. Set appropriate timeouts
3. Use policies to enforce constraints
4. Verify signatures before trusting spans
5. Export audit logs regularly
6. Keep private keys secure

## 📁 Project Structure

```
minicore/
├── src/
│   ├── types.ts              # Type definitions
│   ├── validator.ts          # Span validation
│   ├── signer.ts             # BLAKE3 + Ed25519 crypto
│   ├── sandbox.ts            # Secure execution
│   ├── loader.ts             # Span loading utilities
│   ├── env.ts                # Environment detection
│   ├── runner.ts             # Execution lifecycle
│   ├── core.ts               # Main Minicore class
│   ├── sdk.ts                # Public SDK exports
│   └── kernels/
│       ├── run_code.ts       # Code execution kernel
│       ├── evaluate_prompt.ts # Prompt kernel (stub)
│       └── apply_policy.ts   # Policy kernel
├── examples/
│   ├── basic.ts              # Basic usage examples
│   ├── demo_span.json        # Example span
│   └── ...
├── tests/
│   └── ...                   # Test files (Deno)
├── package.json              # npm package config
├── deno.json                 # Deno config
└── README.md                 # This file
```

## 🧪 Testing

Tests require Deno:

```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Run tests
deno test --allow-all minicore/tests/
```

## 📝 Examples

See `examples/basic.ts` for comprehensive examples:

```bash
# Run with Deno
deno run --allow-all examples/basic.ts
```

## 🔮 Future Extensions

- [ ] Real LLM API integration for `evaluate_prompt`
- [ ] WebAssembly backend for better isolation
- [ ] Persistent state for throttle/circuit breaker
- [ ] Integration with minivault (span storage)
- [ ] VSCode extension
- [ ] Graphical execution visualizer
- [ ] QR code span loading

## 📄 License

MIT - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🙏 Acknowledgments

Built with:
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) - BLAKE3
- [@noble/curves](https://github.com/paulmillr/noble-curves) - Ed25519

---

**Made with ❤️ by the JSON✯Atomic Team**

For more information, see the [JSON✯Atomic specification](https://github.com/danvoulez/Json-Atomic).
