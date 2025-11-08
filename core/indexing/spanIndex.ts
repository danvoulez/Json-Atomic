/**
 * 10. Span Index
 * Indexa spans por tags, agente, tenant, entity_type para busca avançada.
 */
export class SpanIndex {
  private byAgent = new Map<string, any[]>()
  private byTenant = new Map<string, any[]>()
  private byTag = new Map<string, any[]>()
  private byType = new Map<string, any[]>()

  indexSpan(span: any) {
    if (span.did?.actor) {
      const arr = this.byAgent.get(span.did.actor) || []
      arr.push(span)
      this.byAgent.set(span.did.actor, arr)
    }
    if (span.metadata?.tenant_id) {
      const arr = this.byTenant.get(span.metadata.tenant_id) || []
      arr.push(span)
      this.byTenant.set(span.metadata.tenant_id, arr)
    }
    if (span.metadata?.tags) {
      for (const tag of span.metadata.tags) {
        const arr = this.byTag.get(tag) || []
        arr.push(span)
        this.byTag.set(tag, arr)
      }
    }
    if (span.entity_type) {
      const arr = this.byType.get(span.entity_type) || []
      arr.push(span)
      this.byType.set(span.entity_type, arr)
    }
  }

  search({ agent, tenant, tag, entity_type }: { agent?: string; tenant?: string; tag?: string; entity_type?: string }) {
    if (agent) return this.byAgent.get(agent) || []
    if (tenant) return this.byTenant.get(tenant) || []
    if (tag) return this.byTag.get(tag) || []
    if (entity_type) return this.byType.get(entity_type) || []
    return []
  }
}