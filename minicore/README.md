# Minicore 🚀

**Minicore** is a portable, embeddable runtime for executing JSON✯Atomic spans locally. It provides secure execution, policy enforcement, cryptographic signing, and auditable logging — all in a lightweight, self-contained package.

## 🎯 What is Minicore?

Minicore is a mini-instance of the LogLineOS runtime that:
- ✅ Executes spans locally with full validation
- ✅ Supports computational policies (TTL, slow, throttle, circuit breaker)
- ✅ Runs loadable kernels (run_code, evaluate_prompt, apply_policy)
- ✅ Operates in a secure sandbox with configurable timeout
- ✅ Generates auditable logs with BLAKE3 + Ed25519 signatures
- ✅ Exports verifiable NDJSON
- ✅ Works in Deno, Node (bundled), or browser

## 🚀 Quick Start

### Installation (Deno)

```bash
# No installation needed! Just use the module directly
deno run --allow-all minicore/core/minicore.ts
```

### Basic Usage

```typescript
import { Minicore } from './minicore/core/minicore.ts'

// Create minicore instance (auto-generates keys)
const minicore = new Minicore()

// Execute a simple code span
const result = await minicore.execute({
  type: 'execution',
  kind: 'run_code',
  input: {
    code: 'return 2 + 2'
  }
})

console.log('Result:', result.output)  // 4
console.log('Status:', result.status)  // "ok"
console.log('Signed:', !!result.signature)  // true
```

## 📚 Features

### 1. Kernel Execution

Minicore supports multiple execution kernels:

#### run_code
Execute JavaScript code in a secure sandbox:

```typescript
const result = await minicore.execute({
  kind: 'run_code',
  input: {
    code: 'return Math.sqrt(16)',
    timeout: 1000  // ms
  }
})
// result.output === 4
```

#### evaluate_prompt
Process LLM prompts (stub for future integration):

```typescript
const result = await minicore.execute({
  kind: 'evaluate_prompt',
  input: {
    prompt: 'What is the capital of France?',
    model: 'gpt-4',
    temperature: 0.7
  }
})
```

#### apply_policy
Apply policies to spans:

```typescript
const result = await minicore.execute({
  kind: 'apply_policy',
  input: {
    ttl: '5m',
    slow: '100ms'
  }
})
```

### 2. Policy Enforcement

Policies are computational rules applied automatically:

```typescript
const result = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return 42' },
  policy: {
    ttl: '5m',      // Reject if span is older than 5 minutes
    slow: '100ms'   // Mark as slow if execution > 100ms
  }
})

// Policy is automatically applied before execution
console.log('Policy applied:', result.policy_applied)
```

**Supported Policies:**
- `ttl` - Time to live (reject old spans)
- `slow` - Mark slow executions
- `throttle` - Rate limiting (stub)
- `circuit_breaker` - Circuit breaker pattern (stub)

### 3. Cryptographic Signing

All executions are automatically signed with Ed25519:

```typescript
const minicore = new Minicore({
  privateKey: 'your-private-key-hex',
  publicKey: 'your-public-key-hex'
})

const result = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return "signed"' }
})

console.log('Hash:', result.hash)
console.log('Signature:', result.signature)

// Verify signature
const isValid = minicore.verify(result)
console.log('Valid:', isValid)  // true
```

### 4. Dry Run Mode

Test without side effects:

```typescript
const minicore = new Minicore({ dry_run: true })

const result = await minicore.execute({
  kind: 'run_code',
  input: { code: 'console.log("This will not run")' }
})

// Code is validated but not executed
console.log('Dry run result:', result.output)
```

### 5. NDJSON Export

Export execution history as NDJSON:

```typescript
// Execute multiple spans
await minicore.execute({ kind: 'run_code', input: { code: 'return 1' } })
await minicore.execute({ kind: 'run_code', input: { code: 'return 2' } })
await minicore.execute({ kind: 'run_code', input: { code: 'return 3' } })

// Export as NDJSON
const ndjson = minicore.exportNDJSON()
console.log(ndjson)
// Each line is a signed, verifiable span

// Save to file
await Deno.writeTextFile('execution-log.ndjson', ndjson)
```

## 🔐 Security

### Sandbox Isolation

Code execution is isolated with:
- **Timeout**: Configurable timeout (default 3000ms)
- **No network access**: Sandboxed execution
- **No file system**: No access to files
- **Memory limits**: Planned feature

### Cryptography

- **BLAKE3** for hashing with domain separation
- **Ed25519** for signing and verification
- **Deterministic canonicalization** for reproducible hashes

## 📖 API Reference

### Minicore Class

```typescript
class Minicore {
  constructor(config?: MinicoreConfig)
  async execute(span: Partial<Span>): Promise<ExecutionResult>
  verify(signedSpan: SignedSpan): boolean
  exportNDJSON(): string
  getHistory(): ExecutionResult[]
  clearHistory(): void
  getConfig(): MinicoreConfig
}
```

### Configuration

```typescript
interface MinicoreConfig {
  privateKey?: string    // Ed25519 private key (hex)
  publicKey?: string     // Ed25519 public key (hex)
  timeout?: number       // Default timeout in ms
  dry_run?: boolean      // Dry run mode (no execution)
}
```

### Span Structure

```typescript
interface Span {
  type: string           // Span type (e.g., "execution")
  kind?: string          // Kernel to use (e.g., "run_code")
  input?: object         // Kernel-specific input
  output?: unknown       // Execution output
  status?: string        // Status (pending, ok, error)
  duration_ms?: number   // Execution time
  logs?: string[]        // Execution logs
  span_id?: string       // Unique span ID
  trace_id?: string      // Trace ID for correlation
  policy?: object        // Policy configuration
  policy_applied?: string[]  // Applied policies
  meta?: object          // Metadata
}
```

## 🧪 Examples

### Example 1: Simple Code Execution

```typescript
import { Minicore } from './minicore/core/minicore.ts'

const minicore = new Minicore()

const result = await minicore.execute({
  kind: 'run_code',
  input: {
    code: `
      const numbers = [1, 2, 3, 4, 5]
      return numbers.reduce((sum, n) => sum + n, 0)
    `
  }
})

console.log(result.output)  // 15
```

### Example 2: With Context

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

### Example 3: Policy Enforcement

```typescript
const result = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return Date.now()' },
  policy: {
    ttl: '1m',
    slow: '10ms'
  },
  meta: {
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()  // 2 minutes ago
  }
})

console.log(result.status)  // "error"
console.log(result.output.error)  // "Policy denied: Span expired..."
```

### Example 4: Batch Processing

```typescript
const minicore = new Minicore()

const spans = [
  { kind: 'run_code', input: { code: 'return 1 + 1' } },
  { kind: 'run_code', input: { code: 'return 2 + 2' } },
  { kind: 'run_code', input: { code: 'return 3 + 3' } }
]

for (const span of spans) {
  await minicore.execute(span)
}

// Export all executions
const ndjson = minicore.exportNDJSON()
await Deno.writeTextFile('batch-results.ndjson', ndjson)

console.log(`Processed ${minicore.getHistory().length} spans`)
```

## 🧑‍💻 CLI Usage

Create a simple CLI script:

```typescript
// cli.ts
import { Minicore } from './minicore/core/minicore.ts'

const minicore = new Minicore()

// Read span from file
const spanJson = await Deno.readTextFile(Deno.args[0])
const span = JSON.parse(spanJson)

// Execute
const result = await minicore.execute(span)

// Output result
console.log(JSON.stringify(result, null, 2))
```

Usage:

```bash
deno run --allow-read cli.ts examples/demo_span.json
```

## 🌐 Browser Usage

Bundle with esbuild or similar:

```bash
# Install esbuild (if using Node)
npm install -g esbuild

# Bundle for browser
esbuild minicore/core/minicore.ts --bundle --format=esm --outfile=minicore.bundle.js
```

Then use in HTML:

```html
<script type="module">
  import { Minicore } from './minicore.bundle.js'
  
  const minicore = new Minicore()
  const result = await minicore.execute({
    kind: 'run_code',
    input: { code: 'return "Hello from browser!"' }
  })
  
  console.log(result.output)
</script>
```

## 📁 Project Structure

```
minicore/
├── core/
│   ├── minicore.ts         # Main executor
│   ├── sandbox.ts          # Secure execution
│   ├── validator.ts        # Span validation
│   ├── signer.ts           # Crypto (BLAKE3 + Ed25519)
│   └── kernels/
│       ├── run_code.ts     # Code execution kernel
│       ├── evaluate_prompt.ts  # LLM prompt kernel
│       └── apply_policy.ts     # Policy kernel
├── examples/
│   ├── demo_span.json      # Example span
│   ├── prompt_span.json    # Prompt example
│   ├── code_execution.json # Code example
│   └── integration.ts      # Complete integration examples
├── tests/
│   └── core.test.ts        # Unit tests
├── README.md               # This file
└── deno.json               # Deno configuration
```

## 🧪 Testing

Run tests with Deno:

```bash
deno test --allow-all minicore/tests/
```

## 📚 Integration Examples

See `examples/integration.ts` for comprehensive real-world usage examples including:
- Calculator service
- Data processing pipeline
- Policy-based access control
- Async operations
- Audit trail export
- Error handling
- Dry run mode

Run the integration examples:

```bash
deno run --allow-all minicore/examples/integration.ts
```

## 🔮 Future Extensions

- [ ] Integration with minivault (signed span storage)
- [ ] Educational mode with guided explanations
- [ ] VSCode plugin (minicore.plugin)
- [ ] Integration with minicontratos
- [ ] Graphical execution visualizer (miniverse)
- [ ] QR Code span loading
- [ ] WebAssembly backend for better isolation
- [ ] Real LLM API integration
- [ ] Persistent policy state (throttle, circuit breaker)

## 📝 License

MIT - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! See CONTRIBUTING.md for guidelines.

---

**Made with ❤️ by the JSON✯Atomic Team**
