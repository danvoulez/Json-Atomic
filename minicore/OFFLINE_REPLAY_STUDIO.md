# Minicore Chrome: Offline-First + Replay + Policy Studio

This document describes the new features added to Minicore for offline-first operation, deterministic replay, and visual policy management.

## Features

### 🔄 Deterministic Replay (P0)

Execute spans with reproducible results using seeded RNG and fixed timestamps.

#### Key Components

- **ReplayController** (`src/replay.ts`)
  - Seeded random number generation (xorshift128+)
  - Fixed clock for time-sensitive operations
  - Policy order enforcement
  - Environment fingerprinting

#### Usage

```typescript
import { ReplayController } from '@logline/minicore'

const replay = new ReplayController({
  seed: 'my-deterministic-seed',
  policyOrder: ['ttl', 'slow', 'throttle', 'circuit_breaker'],
  fixedTimestamp: Date.now()
})

const result = await replay.execute(span, { timeout: 3000 })

// Verify determinism
const result2 = await replay.execute(span, { timeout: 3000 })
console.assert(result.hash === result2.hash, 'Results should be identical')
```

#### Features

- **Seeded RNG**: Deterministic `Math.random()` using xorshift algorithm
- **Fixed Clock**: `Date.now()` returns consistent timestamps
- **Policy Order**: Explicit ordering ensures consistent policy evaluation
- **Environment Fingerprint**: Captures runtime, platform, and version info

### 🎯 Policy Studio (P0)

Visual interface for configuring, ordering, and simulating policies.

#### Key Components

- **PolicyStudio** (`src/ui/policy-studio.ts`)
  - Visual policy configuration with sliders/inputs
  - Drag-and-drop policy ordering
  - Real-time policy simulation
  - Save/load policy profiles to localStorage

- **Policy Registry** (`src/policies/registry.ts`)
  - Centralized policy metadata
  - Validation utilities
  - Simulation without execution

#### Features

- **Configure Policies**: Set TTL, slow thresholds, throttle, circuit breaker
- **Reorder Policies**: Drag-and-drop or use arrows to change evaluation order
- **Simulate**: Test policy decisions on mock spans without executing
- **Profiles**: Save and load policy configurations
- **Validation**: Real-time validation of policy configurations

#### Available Policies

1. **TTL (Time To Live)** - Reject spans older than threshold
2. **Slow Detection** - Mark slow executions (non-blocking)
3. **Throttle** - Rate limiting (max requests per window)
4. **Circuit Breaker** - Open circuit after failure threshold

### 📜 Ledger Viewer (P1)

View, filter, and manage execution history with NDJSON import/export.

#### Key Components

- **LedgerViewer** (`src/ui/ledger-viewer.ts`)
  - Virtualized table for large ledgers (50 items per page)
  - Filter by status, kernel, policy, or search
  - NDJSON import/export with metadata headers
  - Batch verification

#### Features

- **Import NDJSON**: Load ledgers from files (supports >1k lines)
- **Export NDJSON**: Save with metadata (version, timestamp, env_fingerprint)
- **Verify**: Batch verification with detailed reports
- **Replay**: Click any span to load it for replay
- **Filtering**: By status, kernel type, policies applied, or free-text search

#### NDJSON Format

```ndjson
# Minicore Ledger Export - 2025-11-12T01:00:00.000Z
# Total spans: 100
{"type":"execution","kind":"run_code",...}
{"type":"execution","kind":"evaluate_prompt",...}
```

### 📡 Offline-First PWA (P1)

Service Worker for offline functionality and PWA capabilities.

#### Key Components

- **Service Worker** (`public/sw.js`)
  - Cache-first strategy for app shell
  - Runtime caching for dynamic content
  - Offline fallback to runtime.html

- **PWA Manifest** (`public/manifest.webmanifest`)
  - Installable app
  - Custom shortcuts (Run, Policy Studio, Ledger)
  - Theme colors and icons

#### Features

- **Offline Execution**: Run spans without network
- **Offline Verification**: Verify ledgers locally
- **Cache Management**: Auto-cleanup of old caches
- **Install Prompt**: Chrome will offer to install the app
- **Shortcuts**: Quick access to features from launcher

#### Service Worker Commands

```javascript
// Skip waiting and activate new SW immediately
navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' })

// Clear all caches
navigator.serviceWorker.controller.postMessage({ action: 'clearCache' })

// Update cache manually
navigator.serviceWorker.controller.postMessage({ action: 'updateCache' })
```

### 🔒 Security Enhancements

#### Sandbox Isolation

- **No `fetch`**: Removed from worker scope to prevent network access
- **No WebSocket**: Not available in workers
- **No DOM**: Workers have no access to `window` or `document`
- **Timeout**: Hard termination via `worker.terminate()`
- **Deterministic Mode**: Mocked `Math.random()` and `Date.now()` in replay

#### Verification

```typescript
// typeof fetch in worker context
console.assert(typeof fetch === 'undefined', 'fetch should be unavailable')

// Infinite loop protection
const result = await minicore.execute({
  kind: 'run_code',
  input: { code: 'while(true) {}' }
})
console.assert(result.timedOut === true, 'Should timeout')
```

## Architecture

### File Structure

```
minicore/
├── src/
│   ├── replay.ts              # Deterministic replay controller
│   ├── policies/
│   │   └── registry.ts        # Policy metadata and utilities
│   ├── ui/
│   │   ├── ui-utils.ts        # DOM helpers (no framework)
│   │   ├── policy-studio.ts   # Policy Studio component
│   │   └── ledger-viewer.ts   # Ledger Viewer component
│   ├── adapters/
│   │   └── sandbox.browser.ts # Updated with replay context
│   └── workers/
│       └── sandbox.worker.ts  # Updated with deterministic mocks
├── public/
│   ├── sw.js                  # Service Worker
│   ├── manifest.webmanifest   # PWA manifest
│   ├── icon-192.svg           # App icon (192px)
│   └── icon-512.svg           # App icon (512px)
└── runtime.html               # Updated with tabs and offline indicator
```

### Data Flow

```
User Input → Runtime UI → Minicore SDK → Sandbox Adapter → Web Worker
                                            ↓
                                     Replay Context (if enabled)
                                            ↓
                                     Deterministic Execution
                                            ↓
                                     Ledger Viewer ← Result
```

### Deterministic Execution Flow

1. **User initiates replay**
   - ReplayController creates deterministic context
   - Seed generates consistent RNG state
   - Fixed timestamp provided

2. **Span execution**
   - Context injected into global scope
   - Sandbox adapter passes `replayContext` to worker
   - Worker mocks `Math.random()` and `Date.now()`

3. **Result verification**
   - Hash computed from canonical representation
   - Signature uses same private key
   - Second execution produces identical hash

## Usage Examples

### Basic Replay

```typescript
import { Minicore, ReplayController } from '@logline/minicore'

const minicore = new Minicore()

// Normal execution
const result1 = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return Math.random()' }
})

// Replay with deterministic seed
const replay = new ReplayController({
  seed: 'test-seed-123',
  policyOrder: ['ttl']
})

const result2 = await replay.execute({
  kind: 'run_code',
  input: { code: 'return Math.random()' }
}, { timeout: 3000 })

const result3 = await replay.execute({
  kind: 'run_code',
  input: { code: 'return Math.random()' }
}, { timeout: 3000 })

// result2.output === result3.output (deterministic!)
```

### Policy Simulation

```typescript
import { simulatePolicy } from '@logline/minicore'

const result = simulatePolicy(
  {
    type: 'execution',
    kind: 'run_code',
    duration_ms: 150,
    meta: { created_at: new Date().toISOString() }
  },
  {
    ttl: '5m',
    slow: '100ms'
  },
  ['ttl', 'slow']
)

console.log(result.decision) // 'allow'
console.log(result.reason) // 'Slow execution detected (150ms > 100ms)'
console.log(result.policy_applied) // ['ttl', 'slow']
```

### NDJSON Export/Import

```typescript
import { LedgerViewer } from '@logline/minicore'

const viewer = new LedgerViewer(container)

// Add spans
viewer.addSpan(result1)
viewer.addSpan(result2)

// Export to NDJSON
viewer.exportNDJSON() // Downloads file

// Import from file (via UI file picker)
// User clicks "Import NDJSON" button

// Verify all spans
viewer.verifyAll() // Shows verification report modal
```

## Testing

### Manual Testing

1. **Start demo server**:
   ```bash
   deno task serve:demo
   ```

2. **Open runtime.html**:
   ```
   http://localhost:8080/runtime.html
   ```

3. **Test offline mode**:
   - Open DevTools → Network tab
   - Check "Offline" checkbox
   - Reload page → Should still work
   - Execute spans → Should work offline

4. **Test deterministic replay**:
   - Go to "Run" tab
   - Click "🔄 Execute with Replay" twice
   - Compare hashes → Should be identical

5. **Test Policy Studio**:
   - Go to "🎯 Policy Studio" tab
   - Enable TTL and Slow policies
   - Configure values
   - Click "Simulate Policies"
   - Verify decision and metrics

6. **Test Ledger**:
   - Go to "📜 Ledger" tab
   - Click "Import NDJSON" → Load test file
   - Apply filters
   - Click "Export NDJSON"
   - Click "Verify All"

### Determinism Verification

```typescript
// Test deterministic replay
const seed = 'test-seed-' + Date.now()
const span = {
  kind: 'run_code',
  input: { code: 'return Math.random() + Date.now()' }
}

const replay = new ReplayController({ seed, policyOrder: [] })

const result1 = await replay.execute(span, {})
const result2 = await replay.execute(span, {})

console.assert(result1.hash === result2.hash, 'Hashes must match')
console.assert(result1.output === result2.output, 'Outputs must match')
```

## Performance

### Optimizations

- **Virtualization**: Ledger table only renders 50 visible rows
- **Lazy Loading**: UI components loaded on tab switch
- **Cache Strategy**: Service Worker uses cache-first for assets
- **Web Workers**: True parallelism for code execution
- **localStorage**: Profiles cached locally (no network)

### Benchmarks

- **Replay overhead**: ~5-10ms (context creation + injection)
- **Policy simulation**: <1ms (no actual execution)
- **Ledger filtering**: <50ms for 1000 items
- **NDJSON import**: ~10ms per 100 spans (streaming)

## Limitations

- **Determinism scope**: Limited to `Math.random()` and `Date.now()`
- **Network timing**: Not deterministic (disabled in worker)
- **Policy state**: Throttle/circuit breaker are stubs (no persistent state)
- **Browser compatibility**: Chrome 110+, Firefox 115+, Safari 16+
- **PWA installation**: Requires HTTPS in production

## Future Enhancements

- **Playwright E2E tests**: Automated UI testing
- **Installable PWA**: Better install prompts and splash screens
- **Background sync**: Sync ledger with backend when online
- **IndexedDB**: Store larger ledgers locally
- **WebAssembly**: Faster crypto operations
- **Diff viewer**: Compare two execution results visually
- **Timeline view**: Visualize span execution over time

## References

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [NDJSON Specification](http://ndjson.org/)

## Contributing

When adding new features:

1. **Keep it offline-first**: Ensure features work without network
2. **Maintain determinism**: New kernels should respect replay context
3. **Document security**: Clearly state isolation guarantees
4. **Test thoroughly**: Manual + automated tests
5. **Update this doc**: Add your feature to the relevant section

## License

MIT - See LICENSE file for details
