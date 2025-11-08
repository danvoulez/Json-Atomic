import type { Atomic, VerificationResult } from "./logline-types"

export class LogLineSDK {
  constructor(public endpoint: string, public apiKey?: string) {}

  async append(atomic: Atomic): Promise<string> {
    const resp = await fetch(`${this.endpoint}/append`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
      },
      body: JSON.stringify(atomic),
    })
    if (!resp.ok) throw new Error(await resp.text())
    const { cursor } = await resp.json()
    return cursor
  }

  async scan(limit = 10, cursor?: string, status?: string): Promise<{ items: { atomic: Atomic, cursor: string }[] }> {
    const url = new URL(`${this.endpoint}/scan`)
    url.searchParams.set("limit", String(limit))
    if (cursor) url.searchParams.set("cursor", cursor)
    if (status) url.searchParams.set("status", status)
    const resp = await fetch(url.toString(), {
      headers: {
        ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
      },
    })
    if (!resp.ok) throw new Error(await resp.text())
    return await resp.json()
  }

  async query(trace_id: string): Promise<Atomic[]> {
    const url = new URL(`${this.endpoint}/query`)
    url.searchParams.set("trace_id", trace_id)
    const resp = await fetch(url.toString(), {
      headers: {
        ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
      },
    })
    if (!resp.ok) throw new Error(await resp.text())
    return await resp.json()
  }

  async verify(): Promise<VerificationResult[]> {
    const resp = await fetch(`${this.endpoint}/verify`, {
      headers: {
        ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
      },
    })
    if (!resp.ok) throw new Error(await resp.text())
    return await resp.json()
  }
}