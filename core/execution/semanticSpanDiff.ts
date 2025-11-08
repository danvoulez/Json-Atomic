/**
 * 9. Semantic Span Diff
 * Gera diff cognitivo entre dois spans.
 * Usa LLM (ou heurísticas) para retorno explicável.
 */

export async function semanticSpanDiff(spanA: any, spanB: any, endpoint?: string, apiKey?: string): Promise<any> {
  const prompt = `
Compare os dois spans abaixo e gere um diff cognitivo explicável.

Span A:
${JSON.stringify(spanA, null, 2)}

Span B:
${JSON.stringify(spanB, null, 2)}

Destaque diferenças importantes, mudanças nos campos, resultados e implicações sistêmicas.
`
  // Se endpoint configurado, chama LLM; senão, retorna diff heurístico simples
  if (endpoint) {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({ prompt })
    })
    const { result } = await resp.json()
    return { semantic_diff: result }
  }

  // Solução heurística simples: compara JSON
  const diffs = []
  for (const k of Object.keys(spanA)) {
    if (JSON.stringify(spanA[k]) !== JSON.stringify(spanB[k])) {
      diffs.push({
        field: k,
        from: spanA[k],
        to: spanB[k]
      })
    }
  }
  for (const k of Object.keys(spanB)) {
    if (!(k in spanA)) {
      diffs.push({
        field: k,
        from: undefined,
        to: spanB[k]
      })
    }
  }
  return { diff: diffs }
}