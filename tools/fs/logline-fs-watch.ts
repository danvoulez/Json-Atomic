/**
 * 24. logline-fs-watch
 * Observa modificações em arquivos e gera spans de append automáticos no ledger.
 */

import { Ledger } from "../../core/ledger/ledger.ts"

async function watch(dir = ".") {
  const ledger = new Ledger("./data/ledger.ndjson")
  const watcher = Deno.watchFs(dir)

  for await (const event of watcher) {
    if (event.kind === "modify" || event.kind === "create" || event.kind === "remove") {
      for (const path of event.paths) {
        const atomic = {
          entity_type: "file",
          intent: event.kind + "_file",
          this: path,
          did: { actor: Deno.env.get("USER") || "fswatch", action: event.kind },
          input: {},
          metadata: {
            trace_id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            owner_id: Deno.env.get("USER") || "fswatch"
          }
        }
        await ledger.append(atomic)
        console.log("FS event span:", event.kind, path)
      }
    }
  }
}

if (import.meta.main) {
  await watch(Deno.args[0] || ".")
}