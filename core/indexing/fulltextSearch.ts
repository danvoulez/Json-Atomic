/**
 * 11. Fulltext Search Engine
 * Busca leve em input, output e message dos spans.
 */
export class FulltextSearcher {
  private spans: any[] = []

  addSpan(span: any) {
    this.spans.push(span)
  }

  search(query: string): any[] {
    const q = query.toLowerCase()
    return this.spans.filter(s => {
      let str = ""
      if (s.input) str += JSON.stringify(s.input)
      if (s.output) str += JSON.stringify(s.output)
      if (s.status?.message) str += s.status.message
      return str.toLowerCase().includes(q)
    })
  }
}