# JSON✯Atomic - Exemplos Práticos

Esta pasta contém exemplos práticos de como usar JSON✯Atomic em diferentes cenários.

---

## 📁 Estrutura

```
examples/
├── node/          # Exemplos para Node.js + TypeScript
│   ├── 01-sign-verify.ts
│   ├── 02-ledger-ndjson.ts
│   ├── 03-ttl-policy.ts
│   ├── 04-metrics.ts
│   └── 05-llm-integration.ts
│
├── deno/          # Exemplos para Deno
│   ├── 01-sign-verify.ts
│   ├── 02-ledger-ndjson.ts
│   └── 03-ttl-policy.ts
│
├── integracao_python.py     # Exemplo Python
└── integracao_shell.sh      # Exemplo Shell script
```

---

## 🚀 Executar Exemplos

### Pré-requisitos

1. **Configurar chaves Ed25519**:

```bash
# Gerar chaves
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem

# Ou usar o script incluído
node scripts/generate-keys.js

# Configurar .env
cat > .env << EOF
PRIVATE_KEY=sua_chave_privada_hex
PUBLIC_KEY=sua_chave_publica_hex
EOF
```

2. **Build do projeto** (Node.js):

```bash
npm install
npm run build
```

---

## 📝 Exemplos Node.js

### Exemplo 1: Assinar e Verificar

**O que faz**: Cria um span, assina com Ed25519 e verifica a assinatura.

```bash
ts-node examples/node/01-sign-verify.ts
```

**Aprenda**:
- Como criar spans
- Como assinar digitalmente
- Como verificar assinaturas

---

### Exemplo 2: Ledger NDJSON

**O que faz**: Cria múltiplos spans, salva em arquivo NDJSON e verifica integridade.

```bash
ts-node examples/node/02-ledger-ndjson.ts
```

**Aprenda**:
- Formato NDJSON
- Hash chains
- Verificação em lote
- Append-only storage

---

### Exemplo 3: Política TTL

**O que faz**: Aplica política de Time-To-Live para prevenir replay attacks.

```bash
ts-node examples/node/03-ttl-policy.ts
```

**Aprenda**:
- Políticas computáveis
- TTL (Time To Live)
- Prevenção de replay attacks
- Validação temporal

---

### Exemplo 4: Métricas Prometheus

**O que faz**: Coleta métricas de spans e exporta para Prometheus.

```bash
ts-node examples/node/04-metrics.ts
```

**Aprenda**:
- Instrumentação
- Métricas Prometheus
- Counters e Histograms
- Observabilidade

---

### Exemplo 5: Integração com LLM

**O que faz**: Rastreia interações com LLMs usando spans assinados.

```bash
ts-node examples/node/05-llm-integration.ts
```

**Aprenda**:
- AI-native patterns
- Rastreamento de prompts/respostas
- Auditoria de AI
- Distributed tracing

---

## 🦕 Exemplos Deno

### Executar com Deno

```bash
# Exemplo 1
deno run --allow-read --allow-env examples/deno/01-sign-verify.ts

# Exemplo 2
deno run --allow-read --allow-write --allow-env examples/deno/02-ledger-ndjson.ts

# Exemplo 3
deno run --allow-read --allow-env examples/deno/03-ttl-policy.ts
```

---

## 🐍 Python

Exemplo de integração via subprocess:

```bash
python examples/integracao_python.py
```

---

## 🐚 Shell Script

Exemplo usando CLI via Deno:

```bash
bash examples/integracao_shell.sh
```

---

## 💡 Casos de Uso

### 1. Event Sourcing
Use o Exemplo 2 (Ledger NDJSON) como base para um event store.

### 2. Auditoria e Compliance
Combine Exemplo 1 (assinaturas) com Exemplo 5 (LLM) para rastreamento completo.

### 3. Observabilidade
Use Exemplo 4 (métricas) para monitorar sistema em produção.

### 4. Governança de AI
Use Exemplo 5 para compliance em sistemas com LLMs.

### 5. Integração Multi-Sistema
Use assinaturas para garantir integridade entre serviços.

---

## 🧪 Experimentar

### Modificar e Verificar

```bash
# Executar exemplo 2
ts-node examples/node/02-ledger-ndjson.ts

# Modificar manualmente o ledger
nano /tmp/ledger-example.ndjson
# (altere algum valor no body)

# Verificar novamente - deve detectar adulteração!
ts-node examples/node/02-ledger-ndjson.ts
```

### Testar TTL

```typescript
// Modificar ttlMs em 03-ttl-policy.ts
const ttlPolicy = {
  type: 'ttl',
  ttlMs: 1000  // 1 segundo apenas
}

// Executar e ver spans sendo rejeitados
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- [Getting Started](../docs/getting-started.md)
- [Architecture](../docs/architecture.md)
- [Security](../docs/security.md)
- [API Reference](../docs/api/openapi.md)

---

## 🆘 Problemas Comuns

**Erro: "Cannot find module"**
```bash
# Certifique-se de ter executado build
npm run build
```

**Erro: "PRIVATE_KEY is undefined"**
```bash
# Configure .env
cp .env.example .env
# Edite .env com suas chaves
```

**Erro de permissão (Deno)**
```bash
# Deno requer permissões explícitas
deno run --allow-read --allow-env --allow-write seu-script.ts
```

---

**JSON✯Atomic** — Exemplos práticos para começar rápido! 🚀
