/**
 * 16. Prometheus Exporter
 * Exibe métricas em formato /metrics via HTTP para Grafana/prometheus.
 */
import { Application } from "https://deno.land/x/oak/mod.ts"
import { Ledger } from "../../core/ledger/ledger.ts"

const ledger = new Ledger("./data/ledger.jsonl")

const app = new Application()
app.use(async ctx => {
  if (ctx.request.url.pathname === "/metrics") {
    const scan = await ledger.scan({ limit: 1000 })
    let completed = 0, failed = 0, pending = 0, total = scan.items.length
    let durationSum = 0
    const byAgent: Record<string, number> = {}

    for (const item of scan.items) {
      const atomic = item.atomic
      const state = atomic.status?.state
      if (state === "completed") completed++
      if (state === "failed") failed++
      if (state === "pending") pending++
      if (atomic.status?.duration_ms) durationSum += atomic.status.duration_ms
      if (atomic.did?.actor) {
        byAgent[atomic.did.actor] = (byAgent[atomic.did.actor] || 0) + 1
      }
    }
    let metrics = `# HELP logline_total_spans Total atomics seen\nlogline_total_spans ${total}\n`
    metrics += `# HELP logline_completed_spans Completed atomics\nlogline_completed_spans ${completed}\n`
    metrics += `# HELP logline_failed_spans Failed atomics\nlogline_failed_spans ${failed}\n`
    metrics += `# HELP logline_pending_spans Pending atomics\nlogline_pending_spans ${pending}\n`
    metrics += `# HELP logline_duration_seconds_total Sum of duration (sec)\nlogline_duration_seconds_total ${durationSum / 1000}\n`
    for (const agent in byAgent) {
      metrics += `logline_span_agent{agent="${agent}"} ${byAgent[agent]}\n`
    }
    ctx.response.type = "text"
    ctx.response.body = metrics
  } else {
    ctx.response.status = 404
  }
})

if (import.meta.main) {
  app.listen({ port: 9810 })
  console.log("Prometheus metrics on :9810/metrics")
}