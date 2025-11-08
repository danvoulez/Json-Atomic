# LogLineOS Docs

**Ledger-only constitutional governance platform.**

---

## 🚀 Comece Rápido

1. Instale o pacote:

```bash
npm install logline-core
# ou use Deno diretamente
```

2. Inicie o ledger local:

```bash
deno run --allow-read --allow-write tools/cli/logline-cli.ts append atomic.json
```

---

## 📦 Atomic: Estrutura e Exemplo

```json
{
  "entity_type": "function",
  "intent": "run_code",
  "this": "/functions/soma",
  "did": { "actor": "executor", "action": "run_code" },
  "input": { "args": [2, 3] },
  "metadata": {
    "trace_id": "abc-123",
    "created_at": "2025-11-07T12:12:00Z",
    "owner_id": "danvoulez"
  }
}
```

Ver o [atomic schema](./schemas/atomic.schema.json).  
Campos como `curr_hash` e `signature` serão gerados/sinalizados pelo sistema.

---

## 🔑 Contratos e Políticas

Exemplo de contrato computável:

```json
{
  "id": "file-write",
  "agent": "system",
  "action": "file_write",
  "path_pattern": "^/[\\w\\-/]+\\.(md|txt|json|ts|js)$",
  "policies": {
    "required_tags": ["file-op"],
    "max_duration": 5
  }
}
```

- As políticas são avaliadas e podem disparar spans derivados: **fallback, throttle, ttl**, etc.

---

## 🛠️ CLI Essentials

### Append

```bash
logline append atomic.json
```

### Scan

```bash
logline scan --limit 10
```

### Query

```bash
logline query --trace abc-123
```

### Verify Ledger

```bash
logline verify --verbose
```

---

## 🧭 API REST

Endpoints:

- `POST /append`
- `GET /scan`
- `GET /query`
- `GET /verify`

Veja exemplo em [api/restApi.ts](../api/restApi.ts).

---

## 🔗 Integrações & Observabilidade

- **Observer Bot**: Executor automático para spans com status pending.
- **Prometheus Exporter**: Métricas para Grafana.
- **Webhook Gateway**: Recebe spans do GitHub, Stripe, LLM etc.
- **Telegram/Discord Bot**: Interface de chat para spans.
- **Live Event Stream (SSE/WebSocket)**: Eventos em tempo real.

---

## 🧩 SDK Typescript & Playground

- Tipos e cliente disponíveis em [sdk/logline-types.ts](../sdk/logline-types.ts) e [sdk/logline-sdk.ts](../sdk/logline-sdk.ts)
- Playground interativo: [site/playground/App.tsx](../site/playground/App.tsx)

---

## 🗃️ Persistência & Extensões

- **Ledger Rotation**: Arquivos ou partições por mês/tenant.
- **Storage S3/MinIO**: Persistência de alto volume.
- **Postgres Adapter**: Ledger SQL-first para produção.

---

## 🏛️ Segurança e Auditoria

- **RLS**: Controle granular por tenant/owner.
- **Signature Rotation**: Suporte nativo a múltiplas identidades públicas.
- **Audit Trail Exporter**: Exportação NDJSON para verificação externa.

---

## 🧠 LLM e Cognição

- **Prompt API**
- **LLM-aware Executor**
- **Semantic Span Diff** para diffs cognitivos.

---

## 🧪 Testes e Dev

Rodar testes:

```bash
deno test --allow-read --allow-write tests/core.test.ts
```

Hot reload & dev server:

```bash
deno run --allow-all tools/dev/logline-dev-server.ts
```

---

## 📚 Recursos

- [Documentação dos Schemas](./schemas/atomic.schema.json)
- [Exemplos de contratos](./core/contracts/validator.ts)
- [Suite de Testes](./tests/core.test.ts)
- [Playground Interativo](../site/playground/App.tsx)

---

Perguntas ou sugestões?  
Abra uma issue ou contribua no GitHub!
