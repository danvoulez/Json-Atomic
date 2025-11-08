import { Application, Router } from "https://deno.land/x/oak/mod.ts"
import { Ledger } from '../core/ledger/ledger.ts'
import { LedgerVerifier } from '../core/ledger/verifyLedger.ts'

/**
 * REST API Layer: append, scan, query, verify + API Key Auth
 * 
 * SECURITY NOTE: This uses Deno environment variables.
 * For production, ensure API_KEY is set via environment, not hardcoded.
 * Default "changeme" is for development only.
 */

const API_KEY = Deno.env.get("API_KEY")
if (!API_KEY || API_KEY === "changeme") {
  console.warn("⚠️  WARNING: API_KEY not set or using default 'changeme'. Set via environment for production!")
}

const LEDGER_PATH = Deno.env.get("LEDGER_PATH") || './data/ledger.jsonl'
const ledger = new Ledger(LEDGER_PATH)
const router = new Router()

function auth(ctx: any): boolean {
  if (!API_KEY) {
    return false
  }
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
    const publicKey = Deno.env.get("PUBLIC_KEY_HEX")
    const verifier = new LedgerVerifier(publicKey)
    const result = await verifier.verifyFile(LEDGER_PATH)
    ctx.response.body = result
  })

const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())

if (import.meta.main) {
  const port = parseInt(Deno.env.get("PORT") || "8000")
  app.listen({ port })
  console.log(`REST API running on http://localhost:${port}`)
}