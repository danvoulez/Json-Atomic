import { Ledger } from '../core/ledger/ledger.ts'
import { AtomicExecutor } from '../core/execution/executor.ts'

interface ObserverOpts {
  ledgerPath?: string
  pollIntervalMs?: number
  maxPending?: number
  verbose?: boolean
}

// ObserverBot: monitora pendentes e dispara execução
export class ObserverBot {
  private ledger: Ledger
  private executor: AtomicExecutor
  private opts: ObserverOpts
  private running = false

  constructor(opts: ObserverOpts = {}) {
    this.opts = {
      ledgerPath: opts.ledgerPath || './data/ledger.jsonl',
      pollIntervalMs: opts.pollIntervalMs || 2000,
      maxPending: opts.maxPending || 20,
      verbose: opts.verbose || false
    }
    this.ledger = new Ledger(this.opts.ledgerPath)
    this.executor = new AtomicExecutor(this.ledger)
  }

  async start() {
    this.running = true
    console.log(`[ObserverBot] Started, polling every ${this.opts.pollIntervalMs}ms`)

    while (this.running) {
      try {
        const pendingAtomics = await this.ledger.scan({
          limit: this.opts.maxPending,
          status: 'pending'
        })

        if (pendingAtomics.items.length === 0 && this.opts.verbose) {
          console.log('[ObserverBot] No pending atomics.')
        }

        for (const item of pendingAtomics.items) {
          const atomic = item.atomic
          if (this.opts.verbose) {
            console.log(`[ObserverBot] Executing span: ${atomic.metadata?.trace_id} (${atomic.entity_type}/${atomic.intent})`)
          }
          try {
            await this.executor.processAtomic(atomic)
          } catch (err) {
            console.error(`[ObserverBot] ERROR executing: ${err.message}`)
          }
        }
      } catch (err) {
        console.error(`[ObserverBot] Scan error: ${err.message}`)
      }

      // Aguarda próximo ciclo
      await new Promise(res => setTimeout(res, this.opts.pollIntervalMs))
    }
  }

  stop() {
    this.running = false
    console.log('[ObserverBot] Stopped.')
  }
}

// CLI entrypoint
if (import.meta.main) {
  const bot = new ObserverBot({ verbose: true })
  await bot.start()
}