import { Ledger } from '../core/ledger/ledger.ts'
import { AtomicExecutor } from '../core/execution/executor.ts'

/**
 * ScheduledTrigger: dispara spans agendados por when.scheduled_at
 */

interface ScheduledTriggerOpts {
  ledgerPath?: string
  pollIntervalMs?: number
  maxScheduled?: number
  verbose?: boolean
}

export class ScheduledTrigger {
  private ledger: Ledger
  private executor: AtomicExecutor
  private opts: ScheduledTriggerOpts
  private running = false

  constructor(opts: ScheduledTriggerOpts = {}) {
    this.opts = {
      ledgerPath: opts.ledgerPath || './data/ledger.jsonl',
      pollIntervalMs: opts.pollIntervalMs || 4000,
      maxScheduled: opts.maxScheduled || 20,
      verbose: opts.verbose || false
    }
    this.ledger = new Ledger(this.opts.ledgerPath)
    this.executor = new AtomicExecutor(this.ledger)
  }

  async start() {
    this.running = true
    console.log(`[ScheduledTrigger] Started, polling every ${this.opts.pollIntervalMs}ms`)
    while (this.running) {
      try {
        const atomics = await this.ledger.scan({
          limit: this.opts.maxScheduled,
          status: 'pending'
        })
        const now = new Date()
        for (const item of atomics.items) {
          const atomic = item.atomic
          // Dispara se agendado para antes de agora
          const scheduledAt = atomic.when?.scheduled_at ? new Date(atomic.when.scheduled_at) : null
          if (scheduledAt && scheduledAt <= now) {
            if (this.opts.verbose) {
              console.log(`[ScheduledTrigger] Executing scheduled span: ${atomic.metadata?.trace_id}`)
            }
            await this.executor.processAtomic(atomic)
          }
        }
      } catch (err) {
        console.error(`[ScheduledTrigger] Error: ${err.message}`)
      }
      await new Promise(res => setTimeout(res, this.opts.pollIntervalMs))
    }
  }

  stop() {
    this.running = false
    console.log('[ScheduledTrigger] Stopped.')
  }
}