import { Ledger } from '../core/ledger/ledger.ts'
import { ContractValidator } from '../core/contracts/validator.ts'
import { AtomicExecutor } from '../core/execution/executor.ts'

/**
 * PolicyAgent: Avalia políticas dos atomics e gera spans derivados.
 * Suporte: TTL, throttle, slow-execution, Fallback, etc.
 */

interface PolicyAgentOpts {
  ledgerPath?: string
  pollIntervalMs?: number
  maxActive?: number
  verbose?: boolean
}

export class PolicyAgent {
  private ledger: Ledger
  private validator: ContractValidator
  private executor: AtomicExecutor
  private opts: PolicyAgentOpts
  private running = false

  constructor(opts: PolicyAgentOpts = {}) {
    this.opts = {
      ledgerPath: opts.ledgerPath || './data/ledger.jsonl',
      pollIntervalMs: opts.pollIntervalMs || 5000,
      maxActive: opts.maxActive || 32,
      verbose: opts.verbose || false
    }
    this.ledger = new Ledger(this.opts.ledgerPath)
    this.validator = new ContractValidator()
    this.executor = new AtomicExecutor(this.ledger)
  }

  async start() {
    this.running = true
    console.log(`[PolicyAgent] Started, polling every ${this.opts.pollIntervalMs}ms`)
    while (this.running) {
      try {
        // Busca spans com expired TTL, throttle, etc.
        const atomics = await this.ledger.scan({
          limit: this.opts.maxActive,
          status: 'pending'
        })
        for (const item of atomics.items) {
          const atomic = item.atomic
          if (atomic.policy) {
            if (atomic.policy.ttl && atomic.when?.started_at) {
              const now = Date.now()
              const started = new Date(atomic.when.started_at).getTime()
              const ttlMs = atomic.policy.ttl * 1000
              if (now - started > ttlMs) {
                // TTL expirou: aciona policy if_not / fallback
                if (atomic.policy.if_not) {
                  if (this.opts.verbose) {
                    console.log(`[PolicyAgent] TTL expired for span ${atomic.metadata?.trace_id}`)
                  }
                  await this.executor.processAtomic(
                    {
                      ...atomic,
                      policy: undefined,
                      intent: atomic.policy.if_not,
                      status: { state: 'pending' }
                    }
                  )
                }
              }
            }
            // Outras políticas podem ser agregadas aqui
          }
        }
      } catch (err) {
        console.error(`[PolicyAgent] Error: ${err.message}`)
      }
      await new Promise(res => setTimeout(res, this.opts.pollIntervalMs))
    }
  }

  stop() {
    this.running = false
    console.log('[PolicyAgent] Stopped.')
  }
}