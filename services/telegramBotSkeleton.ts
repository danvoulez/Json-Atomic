/**
 * TelegramBotSkeleton: Interface de chat para spans.
 * (Necessário token via Deno.env + registro de comandos)
 * Esqueleto: use node-telegram-bot-api ou denogram para implementação real.
 */

import { Ledger } from "../core/ledger/ledger.ts"

// Simples esqueleto, sem funcionalidade real (mock)
export class TelegramBotSkeleton {
  constructor(public token: string, private ledger = new Ledger("./data/ledger.jsonl")) {}

  async start() {
    console.log("[TelegramBotSkeleton] Simulado. Integrar usando biblioteca real.")
    // Aqui seria a integração com Telegram API
    // Exemplos:
    // - !append <json>
    // - !scan
    // - !verify
    // - !query <trace_id>
    // Cada comando aciona métodos Ledger/Verifier e responde via chat.
  }
}

// Uso: new TelegramBotSkeleton(Deno.env.get("TELEGRAM_TOKEN")!).start()