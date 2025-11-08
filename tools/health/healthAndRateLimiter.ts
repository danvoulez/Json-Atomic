/**
 * 18. Healthcheck + Rate Limiter
 * Status de saúde de bots e limites globais/por agent.
 */
import { Application } from "https://deno.land/x/oak/mod.ts"
import { Ledger } from "../../core/ledger/ledger.ts"

const ledger = new Ledger("./data/ledger.jsonl")
const agentLastAction: Record<string, number[]> = {}

const RATE_LIMIT_WINDOW = 60000 // 1 minuto
const MAX_PER_AGENT = 60

const app = new Application()
app.use(async ctx => {
  if (ctx.request.url.pathname === "/health") {
    const scan = await ledger.scan({ limit: 100 })
    const bots = ["ObserverBot", "PolicyAgent", "ScheduledTrigger"] // exemplo
    const live = bots.every(bot => scan.items.some(i => i.atomic.did?.actor === bot))
    ctx.response.body = {
      ok: live,
      bots,
      recent_spans: scan.items.length
    }
  } else if (ctx.request.url.pathname === "/ratelimit") {
    const agent = ctx.request.url.searchParams.get("agent")
    if (!agent) return (ctx.response.status = 400)
    const now = Date.now()
    agentLastAction[agent] = (agentLastAction[agent] || []).filter(t => t > now - RATE_LIMIT_WINDOW)
    if (agentLastAction[agent].length > MAX_PER_AGENT) {
      ctx.response.status = 429
      ctx.response.body = { error: "Rate limit exceeded" }
      return
    }
    agentLastAction[agent].push(now)
    ctx.response.body = { ok: true }
  } else {
    ctx.response.status = 404
  }
})

if (import.meta.main) {
  app.listen({ port: 9830 })
  console.log("Healthcheck on :9830/health, RateLimit on :9830/ratelimit?agent=x")
}