/**
 * 19. Ledger Rotation (por mês ou tenant)
 * Particiona ledger por mês ou tenant, cria novos arquivos conforme regras.
 */

import { Ledger } from "./ledger.ts"

export class LedgerRotator {
  private basePath: string
  private mode: "monthly" | "tenant"

  constructor(basePath: string, mode: "monthly" | "tenant" = "monthly") {
    this.basePath = basePath
    this.mode = mode
  }

  getCurrentLedgerFile(meta?: any): string {
    if (this.mode === "monthly") {
      const now = meta?.metadata?.created_at ? new Date(meta.metadata.created_at) : new Date()
      const file = `${this.basePath}/ledger-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}.ndjson`
      return file
    } else if (this.mode === "tenant" && meta?.metadata?.tenant_id) {
      return `${this.basePath}/ledger-${meta.metadata.tenant_id}.ndjson`
    }
    // Fallback padrão
    return `${this.basePath}/ledger.ndjson`
  }

  async append(atomic: any) {
    const file = this.getCurrentLedgerFile(atomic)
    const ledger = new Ledger(file)
    return ledger.append(atomic)
  }
}