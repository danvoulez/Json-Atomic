import { Application, Router } from "https://deno.land/x/oak/mod.ts"
import { Ledger } from '../core/ledger/ledger.ts'
import { LedgerVerifier } from '../core/ledger/verifyLedger.ts'

/**
 * REST API Layer: append, scan, query, verify + API Key Auth
 */

const API_KEY = Deno.env.get("API_KEY") || "changeme"
const ledger = new Ledger('./data/ledger.jsonl')
const router = new Router()

function auth(ctx: any) {
  const key = ctx.request.headers.get("x-api-key")
  return key === API_KEY
}

router
  .post("/append", async (ctx) => {
    if (!auth(ctx)) return ctx.response.status = 401
    const atomic = await ctx.request.body({ type: "json" }).value
    const cursor = await ledger.append(atomic)
    ctx.response.status = 201
    ctx.response.body = { cursor }
  })
  .get("/scan", async (ctx) => {
    if (!auth(ctx)) return ctx.response.status = 401
    const { limit, cursor, status } = ctx.request.url.searchParams
    const result = await ledger.scan({ limit: Number(limit) || 10, cursor, status })
    ctx.response.body = result
  })
  .get("/query", async (ctx) => {
    if (!auth(ctx)) return ctx.response.status = 401
    const { trace_id } = ctx.request.url.searchParams
    const results = await ledger.query({ trace_id })
    ctx.response.body = results
  })
  .get("/verify", async (ctx) => {
    if (!auth(ctx)) return ctx.response.status = 401
    const verifier = new LedgerVerifier()
    const result = await verifier.verifyFile('./data/ledger.jsonl')
    ctx.response.body = result
  })

const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())

if (import.meta.main) {
  app.listen({ port: 8000 })
  console.log("REST API running on http://localhost:8000")
}