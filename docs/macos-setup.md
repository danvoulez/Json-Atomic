# JSON✯Atomic - Setup Nativo macOS

## 1. Instalação do ambiente

Recurso | Comando | Uso
------|--------------------|---------------------------
Deno | `brew install deno` | CLI, APIs, bots, watcher
Chave Ed25519 | `openssl genpkey -algorithm ed25519 -out private.pem && openssl pkey -in private.pem -pubout -out public.pem` | Assinar spans (atomic)
Diretório Ledger | `mkdir -p ~/jsonatomic/data` | Ledger append-only
Variáveis de ambiente | `export SIGNING_KEY_HEX=...; export PUBLIC_KEY_HEX=...` | CLI/Bot assinar/verificar

---

## 2. Scripts Úteis

**Append de atomic.json**
```bash
deno run --allow-all tools/cli/logline-cli.ts append ./spans/atomic.json
```

**Consulta por trace_id**
```bash
deno run --allow-all tools/cli/logline-cli.ts query --trace 123e4567...
```

**Verificação do ledger**
```bash
deno run --allow-all tools/cli/logline-cli.ts verify --verbose
```

**Observer automático**
```bash
deno run --allow-all services/observerBot.ts
```

---

## 3. Diretórios padrão

- `data/ledger.jsonl` – Ledger local append-only
- `schemas/atomic.schema.json` – Schema para validação formal
- `services/` – Bots, triggers, agents
- `core/` – Núcleo: ledger, execução, contratos
- `tools/cli/` – CLI e utilitários locais
- `sdk/` – Tipos e SDK externo

---

## 4. Infra opcional (recomendada p/ produção/testes)

Serviço | Instale via Homebrew         | Justificativa
--------|------------------------------|----------------------
Postgres | `brew install postgresql`   | Ledger SQL (adapter)
Redis    | `brew install redis`        | Cache/fila de spans
MinIO    | `brew install minio`        | Storage S3 compatível
ngrok    | `brew install ngrok`        | Webhooks públicos locais
Grafana  | `brew install grafana`      | Dashboard de métricas

---

## 5. Chave Ed25519 e variáveis de ambiente

```bash
# Gerar chave
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem

# Converter para HEX
xxd -p private.pem | tr -d '\n' > key.hex
xxd -p public.pem | tr -d '\n' > pub.hex

# Variáveis de ambiente
export SIGNING_KEY_HEX=$(cat key.hex)
export PUBLIC_KEY_HEX=$(cat pub.hex)
```

---

Pronto!  
Com isso, você tem tudo necessário para rodar, assinar, verificar, automatizar e observar spans no JSON✯Atomic localmente no macOS.  
Dúvidas? Consulte mais exemplos em [docs/README.md](./README.md).