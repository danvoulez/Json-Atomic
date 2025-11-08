/**
 * 21. Postgres Ledger Adapter
 * Versão SQL-first do append/query/scan com mesma interface computável.
 * Usa Deno.postgres: https://deno.land/x/postgres/mod.ts
 */
import { Client } from "https://deno.land/x/postgres/mod.ts"

export class PostgresLedger {
  private client: Client

  constructor(url: string) {
    this.client = new Client(url)
  }

  async connect() {
    await this.client.connect()
    // Tabela: atomics(id SERIAL PRIMARY KEY, data JSONB, cursor TEXT, created_at TIMESTAMP)
    await this.client.queryObject(`CREATE TABLE IF NOT EXISTS atomics (
      id SERIAL PRIMARY KEY, data JSONB, cursor TEXT, created_at TIMESTAMP DEFAULT NOW()
    )`)
  }

  async append(atomic: any): Promise<string> {
    const cursor = crypto.randomUUID()
    await this.client.queryObject(
      "INSERT INTO atomics (data, cursor) VALUES ($1, $2)", [atomic, cursor]
    )
    return cursor
  }

  async scan({ limit = 10, cursor, status }: { limit?: number, cursor?: string, status?: string }) {
    let q = "SELECT data, cursor FROM atomics"
    const params: any[] = []
    if (status) { q += " WHERE data->'status'->>'state' = $1"; params.push(status) }
    q += " ORDER BY id DESC"
    q += ` LIMIT $${params.length + 1}`; params.push(limit)
    const res = await this.client.queryObject(q, ...params)
    return { items: res.rows.map(r => ({ atomic: r.data, cursor: r.cursor })) }
  }

  async query({ trace_id }: { trace_id: string }) {
    const q = "SELECT data, cursor FROM atomics WHERE data->'metadata'->>'trace_id' = $1 ORDER BY id"
    const res = await this.client.queryObject(q, trace_id)
    return res.rows.map(r => r.data)
  }

  async close() {
    await this.client.end()
  }
}