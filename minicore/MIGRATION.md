# Minicore SDK Migration Guide

This guide explains the changes made during the v1 refactoring and how to migrate from the old structure to the new SDK.

## 🎯 What Changed

### Directory Structure

**Before:**
```
minicore/
├── core/
│   ├── minicore.ts
│   ├── sandbox.ts
│   ├── validator.ts
│   ├── signer.ts
│   └── kernels/
│       ├── run_code.ts
│       ├── evaluate_prompt.ts
│       └── apply_policy.ts
├── examples/
├── tests/
└── README.md
```

**After:**
```
minicore/
├── src/                    # New organized source
│   ├── types.ts           # Strict type definitions
│   ├── validator.ts       # Improved validation
│   ├── signer.ts          # Enhanced crypto
│   ├── sandbox.ts         # Better sandboxing
│   ├── loader.ts          # New: span loading utilities
│   ├── env.ts             # New: environment detection
│   ├── runner.ts          # New: execution lifecycle
│   ├── core.ts            # Minicore class
│   ├── sdk.ts             # Public API facade
│   └── kernels/
│       ├── run_code.ts
│       ├── evaluate_prompt.ts
│       └── apply_policy.ts
├── core/                   # Old structure (kept for compatibility)
├── examples/
│   └── basic.ts           # New comprehensive examples
├── tests/
├── package.json           # New: npm package config
├── tsconfig.json          # New: TypeScript config
└── README_SDK.md          # New: comprehensive docs
```

## 📦 Import Changes

### Old Imports

```typescript
import { Minicore } from './minicore/core/minicore.ts'
import { validateSpan } from './minicore/core/validator.ts'
import { signSpan } from './minicore/core/signer.ts'
```

### New Imports (Recommended)

```typescript
// From SDK (everything exported)
import { 
  Minicore,
  validateSpan,
  signSpan,
  runSpan,
  createPlayground
} from '@logline/minicore'

// Or from source
import { Minicore } from './minicore/src/sdk.ts'
```

## 🔄 API Changes

### Minicore Class

The Minicore class API remains **99% compatible**:

```typescript
// Old and New - both work the same
const minicore = new Minicore()
const result = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return 2 + 2' }
})
```

### New Features Added

#### 1. Convenience Function: `runSpan`

```typescript
// Quick one-off execution
const result = await runSpan({
  kind: 'run_code',
  input: { code: 'return 42' }
})
```

#### 2. Playground Mode

```typescript
const playground = createPlayground()
await playground.code('return 2 + 2')
await playground.prompt('Hello AI')
console.log(playground.history())
```

#### 3. Span Loaders

```typescript
import { loadFromJSON, loadFromFile, loadFromURL } from '@logline/minicore'

const span = loadFromJSON('{"type":"execution",...}')
const span = await loadFromFile('./span.json')
const span = await loadFromURL('https://example.com/span.json')
```

#### 4. Environment Detection

```typescript
import { getRuntime, isDeno, isBrowser } from '@logline/minicore'

console.log(getRuntime())  // "deno" | "node" | "browser" | "unknown"
```

## 🎨 Type Improvements

### Before: Loose Typing

```typescript
// Old - used 'any' and 'unknown'
interface Span {
  type: string
  kind?: string
  input?: any           // ❌ Too loose
  output?: unknown      // ❌ Not specific
  // ...
}
```

### After: Strict Typing

```typescript
// New - strict types throughout
interface Span {
  type: string
  kind?: string
  input?: Record<string, unknown>   // ✅ Structured object
  output?: unknown                   // ✅ Documented
  status?: 'pending' | 'ok' | 'error' // ✅ Literal types
  // ...
}

// Kernel-specific types
interface RunCodeInput {
  code: string
  context?: Record<string, unknown>
  timeout?: number
}
```

## 🚀 New Capabilities

### 1. Browser Support

The new SDK explicitly avoids Node.js-only APIs:

```typescript
// Works in browser!
import { Minicore } from '@logline/minicore'

const minicore = new Minicore()
const result = await minicore.execute({
  kind: 'run_code',
  input: { code: 'return navigator.userAgent' }
})
```

### 2. Better Documentation

All functions now have comprehensive JSDoc comments:

```typescript
/**
 * Execute a span through its complete lifecycle
 * 
 * @param spanInput - Partial span data
 * @param config - Minicore configuration
 * @returns Execution result with signature
 */
export async function executeSpan(...)
```

### 3. Modular Architecture

Each module has a single responsibility:

- `types.ts` - All type definitions
- `validator.ts` - Span validation
- `signer.ts` - Cryptography
- `sandbox.ts` - Code execution
- `loader.ts` - Span loading
- `env.ts` - Environment detection
- `runner.ts` - Execution lifecycle
- `core.ts` - Main class
- `sdk.ts` - Public API

## 🔧 Migration Steps

### For Deno Users

1. Update imports to use `src/sdk.ts`:
   ```typescript
   // Old
   import { Minicore } from './minicore/core/minicore.ts'
   
   // New
   import { Minicore } from './minicore/src/sdk.ts'
   ```

2. Run examples:
   ```bash
   deno run --allow-all minicore/examples/basic.ts
   ```

### For npm Users

1. Install the package:
   ```bash
   npm install @logline/minicore
   ```

2. Update imports:
   ```typescript
   import { Minicore } from '@logline/minicore'
   ```

3. Build if using TypeScript:
   ```bash
   npm run build
   ```

### For Browser Users

1. Bundle the SDK:
   ```bash
   npx esbuild node_modules/@logline/minicore/src/sdk.ts \
     --bundle --format=esm --outfile=minicore.js
   ```

2. Use in HTML:
   ```html
   <script type="module">
     import { Minicore } from './minicore.js'
     // Use minicore...
   </script>
   ```

## ⚠️ Breaking Changes

### Minimal Breaking Changes

The refactoring was designed to be **mostly backward compatible**. The only breaking changes are:

1. **Import paths changed** - Use `src/sdk.ts` instead of `core/minicore.ts`
2. **Package name changed** - From `@json-atomic/minicore` to `@logline/minicore`
3. **Some internal types reorganized** - Public API remains the same

### Deprecated (but still working)

The old `core/` directory structure is kept for backward compatibility during transition. However, it's recommended to migrate to the new `src/` structure.

## 📚 Additional Resources

- [README_SDK.md](./README_SDK.md) - Comprehensive SDK documentation
- [examples/basic.ts](./examples/basic.ts) - Usage examples
- [src/types.ts](./src/types.ts) - Type definitions
- [src/sdk.ts](./src/sdk.ts) - Public API reference

## 🤔 FAQ

### Q: Do I need to change my code?

**A:** Only import paths need to change. The API is 99% compatible.

### Q: Can I still use the old structure?

**A:** Yes, for now. But migrating to `src/` is recommended.

### Q: What about the old README?

**A:** The old README is kept as `README.md`. The new docs are in `README_SDK.md`.

### Q: Will my tests break?

**A:** Tests should continue working with updated imports.

### Q: Is the old code deleted?

**A:** No, the old `core/` directory is preserved for compatibility.

---

**Questions?** Open an issue on [GitHub](https://github.com/danvoulez/Json-Atomic/issues).
