# JSON✯Atomic – Transposição de Atomics para Linha SQL/CSV

## 🚀 O que é "transpor atomic"?
Transpor significa transformar um objeto JSON `Atomic` do JSON✯Atomic em uma linha (row) de tabela — seja SQL, CSV ou outra estrutura tabular.  
Cada chave vira coluna. O valor vira o conteúdo da célula.
Isso é útil para bancos relacionais, BI, relatórios, integração e auditoria.

---

## 🧩 Por que funciona nativamente?
- Schema do Atomic é **plano e previsível** (mesmo os aninhados são normalizáveis, como did, who, this).
- É canônico: a ordem dos campos não altera o significado.
- Autoexplicativo: carrega tipo, intenção, owner, tempo, etc.

---

## 🏗️ Exemplo prático

**Atomic JSON:**  
```json
{
  "who":   { "agent": "system", "tenant_id": "voulezvous" },
  "did":   { "action": "deploy", "entity_type": "contract", "intent": "init" },
  "this":  { "resource": "/identity/init", "type": "memory" },
  "when":  { "started_at": "2025-11-07T15:00:00Z", "trace_id": "abc-123" },
  "status":  { "current": "pending" }
}
```

**Linha SQL/CSV:**
```
agent,tenant_id,action,entity_type,intent,resource,type,started_at,trace_id,status
system,voulezvous,deploy,contract,init,/identity/init,memory,2025-11-07T15:00:00Z,abc-123,pending
```

---

## 🔁 Como fazer na prática

### Em Typescript (JSON✯Atomic)

```typescript
import { atomicToRow, atomsToCSV } from 'tools/util/atomicToRow.ts'

// atomicToRow(json) → objeto plano
const row = atomicToRow(atomic)

// atomsToCSV([atomic]) → string CSV
const csv = atomsToCSV([atomic])
```

### Em SQL/Postgres

```sql
INSERT INTO atomics (
  agent, tenant_id, action, entity_type, intent, resource, type, started_at, trace_id, status
) VALUES (
  'system', 'voulezvous', 'deploy', 'contract', 'init', '/identity/init', 'memory', '2025-11-07T15:00:00Z', 'abc-123', 'pending'
);
```

---

## 🧱 Vantagens de transpor atomics

- **Query fácil:** busca/contagem por qualquer campo
- **Relatórios e dashboards:** direto em BI, Grafana, Metabase, Excel
- **Auditoria formal:** exportação pronta para validação externa
- **Interoperabilidade:** importa em pandas, Google Sheets, Spark, etc
- **Compliance:** atende normativas de bancos, órgão público, LGPD, etc
- **Backup & restore:** linhas exportáveis, replicação instantânea
- **Analytics:** estatísticas rápidas por tenant, agente, ação, etc

---

## ⚙️ Dicas de normalização

- Campos compostos (who, did, this, when) → normalize para colunas planas
- Campos extras (input, output) → salve como text/jsonb (Postgres)
- Campos omitidos → deixe vazio ou NULL
- Pode usar schema versionado para garantir ordem das colunas

---

## 🔗 Exemplos de uso

- Exportar ledger inteiro para CSV para Databricks.
- Importar spans para DataLake.
- Relatar execução para auditor externo usando NDJSON + .csv.
- Integração com PowerBI/Grafana/METABASE.

---

## 🚀 Pronto: atomics são tabulares!

Qualquer atomic pode ser transposto, indexado, buscado, auditado e visualizado.  
A estrutura foi pensada para ser universal e ser utilizada em qualquer ambiente computacional, regulatório ou analítico.
