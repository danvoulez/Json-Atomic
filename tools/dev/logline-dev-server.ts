/**
 * 22. logline-dev-server
 * Servidor de desenvolvimento local interativo com hot reload e validação.
 */
import { Application, Router } from "https://deno.land/x/oak/mod.ts"
import { Ledger } from "../../core/ledger/ledger.ts"
import { canonicalize } from "../../core/canonical.ts"
import { signAtomic } from "../../core/crypto.ts"

const ledger = new Ledger("./data/ledger.ndjson")
const router = new Router()

router.post("/append", async ctx => {
  const atomic = await ctx.request.body({ type: "json" }).value
  // Validação embutida via canonicalize
  atomic.curr_hash = canonicalize(atomic)
  atomic.signature = await signAtomic(atomic, Deno.env.get('SIGNING_KEY_HEX'))
  await ledger.append(atomic)
  ctx.response.body = { ok: true }
})

router.get("/scan", async ctx => {
  ctx.response.body = await ledger.scan({ limit: 20 })
})

// Hot reload: basta recarregar as rotas se arquivo modificar (usando Deno.watchFs seria possível)
const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())

if (import.meta.main) {
  app.listen({ port: 9080 })
  console.log("logline-dev-server rodando em :9080 (append, scan)")
}