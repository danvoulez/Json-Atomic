/**
 * 13. Row-Level Security (RLS)
 * Filtra spans por owner_id/tenant_id para multitenancy e isolamento.
 */
export function filterSpansRLS(spans: any[], actorId?: string, tenantId?: string): any[] {
  return spans.filter(span =>
    (!actorId || span.metadata?.owner_id === actorId) &&
    (!tenantId || span.metadata?.tenant_id === tenantId)
  )
}