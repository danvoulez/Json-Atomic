/**
 * 17. Live Event Stream (SSE/WebSocket)
 * Emite eventos de span_appended para clientes reativos.
 */

import { Application } from "https://deno.land/x/oak/mod.ts"
import { Ledger } from "../core/ledger/ledger.ts"

const ledger = new Ledger("./data/ledger.jsonl")
const clients: Set<any> = new Set()

const app = new Application()

app.use(async (ctx, next) => {
  if (ctx.request.url.pathname === "/events") {
    ctx.response.headers.set("Content-Type", "text/event-stream")
    ctx.response.headers.set("Cache-Control", "no-cache")
    ctx.response.headers.set("Connection", "keep-alive")
    clients.add(ctx)
    ctx.request.done.then(() => clients.delete(ctx))
    await next()
  } else {
    await next()
  }
})

// Gera evento SSE após append
ledger.onSpanAppended = (atomic: any) => {
  for (const ctx of clients) {
    ctx.response.write(`event: span_appended\ndata: ${JSON.stringify(atomic)}\n\n`)
  }
}

if (import.meta.main) {
  app.listen({ port: 9820 })
  console.log("Live event stream on :9820/events")
}