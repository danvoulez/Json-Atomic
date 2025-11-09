import type { Atomic, ValidationResult } from '../../types.js'

interface Contract {
  id: string
  agent: string
  action: string
  path_pattern?: string
  input_schema?: unknown
  output_schema?: unknown
  policies?: {
    max_duration?: number
    required_tags?: string[]
    allowed_tenants?: string[]
  }
}

export class ContractValidator {
  private contracts: Map<string, Contract> = new Map()

  constructor(contracts: Contract[] = []) {
    contracts.forEach(c => this.contracts.set(c.id, c))
  }

  validate(atomic: Atomic): ValidationResult {
    const errors: string[] = []

    // Basic validation
    if (!atomic.entity_type) {
      errors.push('Missing entity_type')
    }

    if (!atomic.this) {
      errors.push('Missing this field')
    }

    if (!atomic.trace_id) {
      errors.push('Missing trace_id')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
}

export const CORE_CONTRACTS: Contract[] = [
  {
    id: 'core_function',
    agent: 'system',
    action: 'execute',
    path_pattern: '/functions/*',
  },
  {
    id: 'core_law',
    agent: 'system',
    action: 'enforce',
    path_pattern: '/laws/*',
  },
]