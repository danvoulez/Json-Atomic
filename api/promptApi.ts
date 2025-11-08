/**
 * Prompt API: Gera spans a partir de prompts estruturados
 * Canonicaliza, simula hash, retorna atomic simulado
 */

import { Router, Application } from "https://deno.land/x/oak/mod.ts"
import { canonicalize } from "../core/canonical.ts"
import { blake3 } from "@noble/hashes/blake3"

const router = new Router()
router.post("/prompt", async (ctx) => {
  const { prompt, intent, entity_type, actor } = await ctx.request.body({ type: "json" }).value

  // Estrutura atomic
  const atomic = {
    entity_type: entity_type || "function",
    intent: intent || "run_code",
    did: { actor: actor || "llm", action: intent || "run_code" },
    input: { prompt },
    metadata: {
      trace_id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    }
  }
  const canonical = canonicalize(atomic)
  const curr_hash = Buffer.from(blake3(new TextEncoder().encode(canonical))).toString("hex")
  atomic.curr_hash = curr_hash

  ctx.response.body = { atomic }
})

const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())

if (import.meta.main) {
  app.listen({ port: 8200 })
  console.log("Prompt API running on http://localhost:8200")
}