-- 1. Tabela Bruta: atomic_raw (JSON canônico, imutável)
CREATE TABLE atomic_raw (
  hash         text PRIMARY KEY,             -- blake3:<hex>
  json         jsonb NOT NULL,               -- span completo
  signature    text,                         -- ed25519:<hex>
  verified_at  timestamptz,                  -- quando assinatura foi verificada
  created_at   timestamptz DEFAULT now()
);

-- 2. Tabela Flat: projeção determinística dos campos principais para query/index
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
  status_ok        boolean,                   -- derivado
  tags             text[]                     -- opcional
);

-- 3. Índices para performance analítica
CREATE INDEX idx_flat_tenant_status ON atomic_flat(tenant_id, status_current, when_started_at DESC);
CREATE INDEX idx_flat_trace ON atomic_flat(when_trace_id);
CREATE INDEX idx_flat_action ON atomic_flat(did_action);
CREATE INDEX idx_flat_resource ON atomic_flat(this_resource);

CREATE INDEX idx_raw_json_gin ON atomic_raw USING gin (json jsonb_path_ops);

-- 4. RLS (multi-tenancy segura)
ALTER TABLE atomic_raw  ENABLE ROW LEVEL SECURITY;
ALTER TABLE atomic_flat ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_raw
  ON atomic_raw
  USING ((json->'metadata'->>'tenant_id') = current_setting('app.tenant_id', true));

CREATE POLICY tenant_flat
  ON atomic_flat
  USING (tenant_id = current_setting('app.tenant_id', true));