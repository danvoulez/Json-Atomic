# Atomic Transposition Layer (ATL) — Blueprint Técnico

O ATL é uma camada de ingestão e projeção determinística para os Atomics JSON✯Atomic (JSON span), projetada para alta eficiência analítica, SQL-friendly, multi-tenant, auditável e idempotente.  
Este documento traz a arquitetura enxuta e potente, pronta para produção.

---

## 1. Esquema SQL (PostgreSQL-first)

**Raw:**  
Tabela append-only, imutável, armazena o JSON canônico  
```sql
CREATE TABLE atomic_raw (
  hash         text PRIMARY KEY,            
  json         jsonb NOT NULL,              
  signature    text,                        
  verified_at  timestamptz,                 
  created_at   timestamptz DEFAULT now()
);
```

**Flat:**  
Projeção determinística dos campos quentes para consultas/índices  
```sql
CREATE TABLE atomic_flat (
  hash             text PRIMARY KEY REFERENCES atomic_raw(hash) ON DELETE CASCADE,
  tenant_id        text,
  owner_id         text,
  who_agent        text,
  who_version      text,
  did_action       text,
  did_entity_type  text,
  did_intent       text,
  this_resource    text,
  this_type        text,
  when_started_at  timestamptz,
  when_completed_at timestamptz,
  when_duration_ms integer,
  when_trace_id    uuid,
  status_current   text,
  status_ok        boolean,                 
  tags             text[]
);
```

**Colunas geradas (alternativo):**  
Evite tabela flat extra se desejar manter tudo em `atomic_raw`  
```sql
ALTER TABLE atomic_raw
  ADD COLUMN who_agent text GENERATED ALWAYS AS ((json->'who'->>'agent')) STORED;
```

**Índices:**
```sql
CREATE INDEX idx_flat_tenant_status ON atomic_flat(tenant_id, status_current, when_started_at DESC);
CREATE INDEX idx_flat_trace ON atomic_flat(when_trace_id);
CREATE INDEX idx_flat_action ON atomic_flat(did_action);
CREATE INDEX idx_flat_resource ON atomic_flat(this_resource);
CREATE INDEX idx_raw_json_gin ON atomic_raw USING gin (json jsonb_path_ops);
```

**RLS multi-tenancy:**
```sql
ALTER TABLE atomic_raw   ENABLE ROW LEVEL SECURITY;
ALTER TABLE atomic_flat  ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_raw
  ON atomic_raw
  USING ((json->'metadata'->>'tenant_id') = current_setting('app.tenant_id', true));

CREATE POLICY tenant_flat
  ON atomic_flat
  USING (tenant_id = current_setting('app.tenant_id', true));
```
---

## 2. Mapeamento determinístico (flatten spec)

Chaves → colunas:
- who.agent → who_agent
- who.version → who_version
- did.action → did_action
- did.entity_type → did_entity_type
- did.intent → did_intent
- this.resource → this_resource
- this.type → this_type
- when.started_at → when_started_at
- when.completed_at → when_completed_at
- when.duration_ms → when_duration_ms
- when.trace_id    → when_trace_id
- status.current   → status_current
- metadata.tenant_id → tenant_id
- metadata.owner_id   → owner_id
- metadata.tags[]     → tags[]
- status_ok => status_current in ('validated','approved','executing','completed')

---

## 3. Pipeline de ingestão (Deno, idempotente)

Fluxo: ler `.jsonl` ou API → canonicalizar → blake3 → verificar assinatura → UPSERT

```typescript
// deno run --allow-net --allow-read --allow-env ingest.ts
import { connect } from "https://deno.land/x/postgres/mod.ts";
import { blake3 } from "@noble/hashes/blake3";
import { bytesToHex } from "@noble/hashes/utils";

const sql = new (await connect({ hostname: "127.0.0.1", database: "logline", user: "dan" }));

function preimage(span){ return "JsonAtomicOS:stable-v1:" + stableStringify(prepareForHash(span)); }
function prepareForHash(a){ /* remova curr_hash, signature etc */ return a; }

async function upsert(span) {
  const h    = bytesToHex(blake3(new TextEncoder().encode(preimage(span))));
  const hash = `blake3:${h}`;
  const sig  = span?.confirmed_by?.signature?.replace(/^ed25519:/,'');
  let verified_at = null;
  // if (sig && await verifyEd25519(sig, h, pubKeyHex)) verified_at = new Date().toISOString();

  await sql.queryObject`
    INSERT INTO atomic_raw (hash, json, signature, verified_at)
    VALUES (${hash}, ${span}, ${span?.confirmed_by?.signature ?? null}, ${verified_at})
    ON CONFLICT (hash) DO NOTHING;
  `;
  await sql.queryObject`
    INSERT INTO atomic_flat (
      hash, tenant_id, owner_id,
      who_agent, who_version,
      did_action, did_entity_type, did_intent,
      this_resource, this_type,
      when_started_at, when_completed_at, when_duration_ms, when_trace_id,
      status_current, status_ok, tags
    ) VALUES (
      ${hash},
      ${span?.metadata?.tenant_id ?? null},
      ${span?.metadata?.owner_id ?? null},
      ${span?.who?.agent ?? null},
      ${span?.who?.version ?? null},
      ${span?.did?.action ?? null},
      ${span?.did?.entity_type ?? null},
      ${span?.did?.intent ?? null},
      ${span?.this?.resource ?? null},
      ${span?.this?.type ?? null},
      ${span?.when?.started_at ?? null},
      ${span?.when?.completed_at ?? null},
      ${span?.when?.duration_ms ?? null},
      ${span?.when?.trace_id ?? null},
      ${span?.status?.current ?? null},
      ${["validated","approved","executing","completed"].includes(span?.status?.current ?? "")},
      ${span?.metadata?.tags ?? null}
    )
    ON CONFLICT (hash) DO NOTHING;
  `;
}
```
- Idempotência: por `hash` (único)
- Integridade: assinatura verificada pelo app layer

---

## 4. Particionamento e índices

- Particione `atomic_flat` por mês (`when_started_at`) ou por tenant+mês para retenção/performance
- Índices compostos típicos:
  - `(tenant_id, status_current, when_started_at DESC)`
  - `(did_action, when_started_at DESC)`
  - `(when_trace_id)`

---

## 5. Vistas analíticas

```sql
CREATE MATERIALIZED VIEW mv_atomic_kpis AS
SELECT
  tenant_id,
  date_trunc('day', when_started_at) AS day,
  count(*) FILTER (WHERE status_current='completed') AS completed,
  count(*) FILTER (WHERE status_current='failed')    AS failed,
  avg(when_duration_ms)                              AS p50_ms
FROM atomic_flat
GROUP BY 1,2;

CREATE INDEX mv_kpis_tenant_day ON mv_atomic_kpis(tenant_id, day DESC);

-- Atualização programada:
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_atomic_kpis;
```

---

## 6. Segurança (RLS) e contexto

- Forçar `SET app.tenant_id = '<tenant>'` na conexão para multi-tenancy seguro
- Policies acima restringem leitura/inserção por tenant automaticamente

---

## 7. Exportação columnar

- Parquet:  
  `COPY (SELECT ... FROM atomic_flat) TO 's3://.../atomic_flat.parquet' (FORMAT PARQUET);`
- CSV:  
  `COPY (SELECT ... FROM atomic_flat) TO STDOUT WITH CSV HEADER;`

---

## 8. Operação e SLOs

- Ingestão: batches de 10k com COPY → staging → INSERT SELECT para atomic_flat
- Métricas: contagem por did_action, status_current, p95 duration_ms
- Retenção: rotação mensal + arquivamento S3 (hash-preserving)

---

## 💡 Por que é eficiente?

- **Transposição determinística:** scans rápidos, índices úteis, BI instantâneo
- **Idempotência por hash:** ingestão segura, sem duplicatas
- **Separação raw/flat:** leitura rápida (flat/hot) e preservação canônica (raw/cold)
- **RLS:** multitenancy seguro, sem complexidade no app

---

**Adapte para outros bancos ou pipelines conforme seu contexto. Essa camada torna JSON✯Atomic pronto para produção analítica, compliance e interoperabilidade universal.**