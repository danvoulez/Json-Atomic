import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts'
import { Ledger } from '../core/ledger/ledger.ts'
import { canonicalize } from '../core/canonical.ts'
import { ContractValidator } from '../core/contracts/validator.ts'
import { CodeExecutor } from '../core/execution/executor.ts'
import { LedgerVerifier } from '../core/ledger/verifyLedger.ts'

Deno.test('Canonical: deterministic JSON', () => {
  // ...código dos testes conforme fornecido...
})

// Run with: deno test --allow-read --allow-write tests/