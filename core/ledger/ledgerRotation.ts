/**
 * 19. Ledger Rotation (por mês ou tenant)
 * Particiona ledger por mês ou tenant, cria novos arquivos conforme regras.
 */

import { Ledger } from "./ledger.js"
import type { Atomic } from "../../types.js"

export class LedgerRotator {
  private basePath: string
  private mode: "monthly" | "tenant"

  constructor(basePath: string, mode: "monthly" | "tenant" = "monthly") {
    this.basePath = basePath
    this.mode = mode
  }

  getCurrentLedgerFile(atomic?: Atomic): string {
    if (this.mode === "monthly") {
      const now = atomic?.metadata?.created_at ? new Date(atomic.metadata.created_at) : new Date()
      const file = `${this.basePath}/ledger-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}.ndjson`
      return file
    } else if (this.mode === "tenant" && atomic?.metadata?.tenant_id) {
      return `${this.basePath}/ledger-${atomic.metadata.tenant_id}.ndjson`
    }
    // Fallback padrão
    return `${this.basePath}/ledger.ndjson`
  }

  async append(atomic: Atomic): Promise<string> {
    const file = this.getCurrentLedgerFile(atomic)
    const ledger = new Ledger(file)
    return ledger.append(atomic)
  }
}