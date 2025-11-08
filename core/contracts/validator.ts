import { z } from 'https://deno.land/x/zod/mod.ts'

interface Contract {
  id: string
  agent: string
  action: string
  path_pattern?: string
  input_schema?: any
  output_schema?: any
  policies?: {
    max_duration?: number
    required_tags?: string[]
    allowed_tenants?: string[]
  }
}

export class ContractValidator {
  // ...código completo conforme fornecido...
}

export const CORE_CONTRACTS: Contract[] = [
  // ...contratos fixos conforme fornecido...
]