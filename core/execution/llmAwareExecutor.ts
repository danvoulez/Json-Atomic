/**
 * 8. LLM-aware Executor
 * Executor que chama LLM e registra input/output como spans auditáveis.
 */

export class LLMAwareExecutor {
  constructor(public ledger: any, public llmEndpoint: string, public apiKey?: string) {}

  async executePromptSpan(atomic: any): Promise<any> {
    const payload = {
      prompt: atomic.input?.prompt || atomic.input,
      max_tokens: atomic.input?.max_tokens || 256,
      temperature: atomic.input?.temperature || 0.3
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`
    const resp = await fetch(this.llmEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    const data = await resp.json()

    // Cria span de output
    const completedAtomic = {
      ...atomic,
      prev: atomic.curr_hash,
      output: {
        llm_result: data,
        raw: data,
      },
      status: {
        state: 'completed',
        result: 'ok',
        message: ''
      },
      when: {
        ...atomic.when,
        completed_at: new Date().toISOString(),
      }
    }
    await this.ledger.append(completedAtomic)
    return completedAtomic
  }
}