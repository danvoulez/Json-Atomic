/**
 * Teste ponta-a-ponta LogLineOS
 * - Gera atomic span, assina, inclui no ledger, executa pelo observer, verifica resultado e exporta NDJSON
 */

import { Ledger } from "../core/ledger/ledger.ts"
import { signAtomic } from "../core/crypto.ts"
import { AtomicExecutor } from "../core/execution/executor.ts"
import { LedgerVerifier } from "../core/ledger/verifyLedger.ts"
import { exportLedgerNDJSON } from "../tools/exporter/auditTrailExporter.ts"

// 1. Cria atomic span simples
const atomic = {
  entity_type: "function",
  intent: "run_code",
  this: "add",
  did: { actor: "executor", action: "run_code" },
  input: { args: [4, 7] },
  metadata: {
    trace_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    owner_id: Deno.env.get("USER") || "e2e"
  }
}
// 2. Assina atomic
const signed = await signAtomic(atomic, Deno.env.get('SIGNING_KEY_HEX'))
atomic.curr_hash = signed.curr_hash
atomic.signature = signed.signature

// 3. Append ao ledger local
const ledger = new Ledger("./data/ledger.jsonl")
const cursor = await ledger.append(atomic)
console.log("Atomic signed and appended, cursor:", cursor)

// 4. Executa span automaticamente (simula observer)
const executor = new AtomicExecutor(ledger)
const resultSpan = await executor.processAtomic(atomic)
console.log("Executed span:", resultSpan.status)

// 5. Verifica ledger (assinatura, hash)
const verifier = new LedgerVerifier()
const verification = await verifier.verifyFile("./data/ledger.jsonl", { verbose: true })
console.log("Verification summary:", verification)

// 6. Exporta NDJSON audit trail
await exportLedgerNDJSON("./data/ledger.jsonl", "./audit.ndjson")
console.log("Audit exported to ./audit.ndjson")

// 7. Consulta por trace_id
const lookup = await ledger.query({ trace_id: atomic.metadata.trace_id })
console.log("Query by trace_id found", lookup.length, "spans.")