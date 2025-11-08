/**
 * 15. Audit Trail Exporter
 * Exporta ledger como NDJSON assinado para auditoria externa.
 */
import { Ledger } from "../../core/ledger/ledger.ts"
import { canonicalize } from "../../core/canonical.ts"

export async function exportLedgerNDJSON(ledgerPath: string, outPath: string) {
  const ledger = new Ledger(ledgerPath)
  const all = await ledger.scan({ limit: 1000000 }) // Exporta tudo
  const lines = []
  for (const item of all.items) {
    const atomic = item.atomic
    lines.push(JSON.stringify({
      canonical: canonicalize(atomic),
      curr_hash: atomic.curr_hash,
      signature: atomic.signature
    }))
  }
  await Deno.writeTextFile(outPath, lines.join("\n"))
  console.log(`Ledger exportado para NDJSON: ${outPath}`)
}

// Uso: await exportLedgerNDJSON('./data/ledger.jsonl', './audit.ndjson')