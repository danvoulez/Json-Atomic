/**
 * 23. logline-git-hook
 * Pre-commit hook para git que gera spans computáveis para commit, merge, etc.
 * Salva atomic no ledger local.
 */
import { Ledger } from "../../core/ledger/ledger.ts"

async function runGitHook() {
  const args = Deno.args // ["commit", ...]
  const event = args[0] || "commit"
  const meta = {
    entity_type: "file",
    intent: "git_" + event,
    this: "repo",
    did: { actor: Deno.env.get("USER") || "git", action: event },
    input: {},
    metadata: {
      trace_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      owner_id: Deno.env.get("USER") || "git"
    }
  }
  const ledger = new Ledger("./data/ledger.ndjson")
  await ledger.append(meta)
  console.log("Git event span appended:", meta.did)
}

if (import.meta.main) {
  await runGitHook()
}