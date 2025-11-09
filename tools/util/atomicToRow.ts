/**
 * Transpõe um Atomic JSON para ROW: SQL/CSV
 * - Cria uma linha (objeto plano) com colunas definidas por schema
 * - Nested são normalizados conforme padrão JSON✯Atomic
 */
type Atomic = Record<string, any>

// Mapeia o Atomic para uma linha plana
export function atomicToRow(atomic: Atomic): Record<string, string> {
  const row: Record<string, string> = {}

  // who.*
  if (atomic.who) {
    if (atomic.who.agent) row.agent = atomic.who.agent
    if (atomic.who.tenant_id) row.tenant_id = atomic.who.tenant_id
  }

  // did.*
  if (atomic.did) {
    if (atomic.did.action) row.action = atomic.did.action
    if (atomic.did.entity_type) row.entity_type = atomic.did.entity_type
    if (atomic.did.intent) row.intent = atomic.did.intent
  }

  // this.*
  if (atomic.this) {
    if (atomic.this.resource) row.resource = atomic.this.resource
    if (atomic.this.type) row.type = atomic.this.type
    // Se 'this' for string direto
    if (typeof atomic.this === "string") row.resource = atomic.this
  }

  // when.*
  if (atomic.when) {
    if (atomic.when.started_at) row.started_at = atomic.when.started_at
    if (atomic.when.trace_id) row.trace_id = atomic.when.trace_id
    if (atomic.when.completed_at) row.completed_at = atomic.when.completed_at
  }
  // status.*
  if (atomic.status) {
    row.status = atomic.status.current || atomic.status.state || atomic.status.result || ""
  }

  // Outros padrões típicos JSON✯Atomic
  if (atomic.entity_type) row.entity_type = atomic.entity_type
  if (atomic.intent) row.intent = atomic.intent
  if (atomic.metadata?.trace_id) row.trace_id = atomic.metadata.trace_id
  if (atomic.metadata?.created_at) row.created_at = atomic.metadata.created_at
  if (atomic.metadata?.owner_id) row.owner_id = atomic.metadata.owner_id

  // Input/output -> pode salvar como JSON/texto separado
  if (atomic.input) row.input = JSON.stringify(atomic.input)
  if (atomic.output) row.output = JSON.stringify(atomic.output)

  return row
}

// Cria CSV a partir de uma lista de Atomics
export function atomsToCSV(atomics: Atomic[]): string {
  if (atomics.length === 0) return ""
  // Usa conjunto de chaves padronizadas
  const allRows = atomics.map(atomicToRow)
  const headers = Array.from(
    new Set(allRows.flatMap(row => Object.keys(row)))
  )
  const lines = [
    headers.join(","),
    ...allRows.map(row => headers.map(h => row[h] || "").join(","))
  ]
  return lines.join("\n")
}

/*
Exemplo de uso:
const atomic = {
  "who": { "agent": "system", "tenant_id": "voulezvous" },
  "did": { "action": "deploy", "entity_type": "contract", "intent": "init" },
  "this": { "resource": "/identity/init", "type": "memory" },
  "when": { "started_at": "2025-11-07T15:00:00Z", "trace_id": "abc-123" },
  "status": { "current": "pending" }
}
console.log(atomicToRow(atomic));

const csv = atomsToCSV([atomic])
console.log(csv)
*/