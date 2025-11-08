export { Ledger } from './core/ledger/ledger.js'
export { LedgerVerifier } from './core/ledger/verifyLedger.js'
export { canonicalize } from './core/canonical.js'
export { signAtomic, verifySignature, generateKeyPair } from './core/crypto.js'
export { ContractValidator, CORE_CONTRACTS } from './core/contracts/validator.js'
export { CodeExecutor, AtomicExecutor } from './core/execution/executor.js'

// Re-export types
export type {
  Atomic,
  Contract,
  ExecutionResult,
  VerificationResult
} from './types.js'

// Version
export const VERSION = '1.0.0'