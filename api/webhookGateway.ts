import { Ledger } from '../core/ledger/ledger.ts'
import { Application, Router } from "https://deno.land/x/oak/mod.ts"
import { verifySignature } from '../core/crypto.ts'

/**
 * Webhook Gateway: Recebe spans externos via POST assinado
 */

const ledger = new Ledger('./data/ledger.jsonl')
const router = new Router()
const API_KEY = Deno.env.get("API_KEY") || "changeme"

function auth(ctx: any) {
  const key = ctx.request.headers.get("x-api-key")
  return key === API_KEY
}

router.post("/webhook", async (ctx) => {
  if (!auth(ctx)) return ctx.response.status = 401
  const { atomic, signature, publicKey } = await ctx.request.body({ type: 'json' }).value
  // Verifica assinatura da submission externa
  if (!verifySignature(atomic, signature, publicKey)) {
    ctx.response.status = 400
    ctx.response.body = {
      error: "Invalid signature"
    }
    return
  }
  const cursor = await ledger.append(atomic)
  ctx.response.status = 201
  ctx.response.body = { cursor }
})

const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())

if (import.meta.main) {
  app.listen({ port: 8100 })
  console.log("Webhook Gateway running on http://localhost:8100")
}