/**
 * 12. Graph View
 * Gera representação de spans com parent_id em árvore recursiva.
 * Formato JSON e DOT para visualização interativa.
 */
export function buildSpanGraph(spans: any[]): any {
  const nodes: Record<string, any> = {}
  spans.forEach(span => {
    nodes[span.metadata?.trace_id] = { ...span, children: [] }
  })
  // Relaciona filhos
  for (const span of spans) {
    const pid = span.metadata?.parent_id
    if (pid && nodes[pid]) {
      nodes[pid].children.push(nodes[span.metadata.trace_id])
    }
  }
  // Retorna todos os roots (sem parent_id)
  return Object.values(nodes).filter(n => !n.metadata?.parent_id)
}

export function spanGraphToDOT(spans: any[]): string {
  let dot = "digraph Spans {\n"
  spans.forEach(span => {
    const id = span.metadata?.trace_id
    dot += `"${id}" [label="${span.entity_type}\\n${id}"];\n`
    if (span.metadata?.parent_id) {
      dot += `"${span.metadata.parent_id}" -> "${id}";\n`
    }
  })
  dot += "}\n"
  return dot
}