export { Ledger } from './core/ledger/ledger.ts'
export { LedgerVerifier } from './core/ledger/verifyLedger.ts'
export { canonicalize } from './core/canonical.ts'
export { signAtomic, verifySignature } from './core/crypto.ts'
export { ContractValidator, CORE_CONTRACTS } from './core/contracts/validator.ts'
export { CodeExecutor, AtomicExecutor } from './core/execution/executor.ts'

// Re-export types
export type {
  Atomic,
  Contract,
  ExecutionResult,
  VerificationResult
} from './types.ts'

// Version
export const VERSION = '1.0.0'