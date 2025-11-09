# Arquitetura JSON✯Atomic

Este documento detalha os componentes, conceitos e decisões de design do JSON✯Atomic.

---

## 📐 Visão Geral

JSON✯Atomic é construído em camadas, cada uma com responsabilidades bem definidas:

```
┌─────────────────────────────────────────────────────┐
│              Application Layer                       │
│  (Apps, CLIs, Bots, Integrações)                    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Core Library Layer                      │
│  • Span Creation & Validation                       │
│  • Cryptographic Operations (sign/verify)           │
│  • Policy Engine                                    │
│  • Ledger Operations                                │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Storage Layer                           │
│  • NDJSON Files (append-only)                       │
│  • Optional: PostgreSQL/ClickHouse                  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│           Infrastructure Layer                       │
│  • Observability (logs, metrics, traces)            │
│  • Health Checks                                     │
│  • Backup/Restore                                    │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Conceitos Fundamentais

### 1. Spans (Atomic Units)

**Span** é a unidade fundamental do JSON✯Atomic — um evento atômico, estruturado e assinável.

#### Estrutura de um Span

```typescript
interface Span {
  // Identificação única
  id: string              // UUID v4
  
  // Tipo do evento
  type: string            // ex: "user.created", "payment.processed"
  
  // Payload do evento
  body: Record<string, any>
  
  // Metadados
  meta?: {
    traceId?: string      // Para distributed tracing
    parentId?: string     // Referência ao span pai
    timestamp?: number    // Unix timestamp em ms
    source?: string       // Origem do evento
    [key: string]: any    // Metadados adicionais
  }
  
  // Assinatura (adicionada após signSpan)
  signature?: Signature
  
  // Hash do span anterior (para hash chain)
  previousHash?: string
  
  // Versão do schema
  schema_version: string  // "1.1.0"
}
```

#### Exemplo de Span Completo

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "payment.processed",
  "schema_version": "1.1.0",
  "body": {
    "amount": 99.99,
    "currency": "USD",
    "paymentMethod": "credit_card",
    "customerId": "cus_123"
  },
  "meta": {
    "traceId": "trace-abc-123",
    "timestamp": 1699564800000,
    "source": "payment-service"
  },
  "signature": {
    "alg": "Ed25519",
    "public_key": "302a300506032b6570032100...",
    "sig": "5a7d8f9e...",
    "signed_at": "2024-11-09T12:00:00Z"
  },
  "previousHash": "blake3:abc123..."
}
```

### 2. Ledger NDJSON

O ledger é um arquivo **append-only** em formato **NDJSON** (Newline Delimited JSON).

#### Por que NDJSON?

✅ **Simplicidade**: Um span por linha, fácil de ler e processar  
✅ **Streaming**: Pode processar gigabytes sem carregar tudo em memória  
✅ **Portabilidade**: Funciona com `cat`, `grep`, `jq`, e qualquer ferramenta Unix  
✅ **Versionável**: Git, rsync, e outras ferramentas funcionam naturalmente  
✅ **Zero Dependencies**: Não precisa de banco especial  

#### Exemplo de Ledger

```ndjson
{"id":"span1","type":"user.created","body":{"userId":"u1"},"signature":{...}}
{"id":"span2","type":"email.sent","body":{"to":"user@ex.com"},"signature":{...}}
{"id":"span3","type":"payment.processed","body":{"amount":99},"signature":{...}}
```

#### Operações no Ledger

```typescript
// Append
function appendSpan(ledgerPath: string, span: SignedSpan) {
  const line = JSON.stringify(span) + '\n'
  fs.appendFileSync(ledgerPath, line)
}

// Read (streaming)
async function* readLedger(ledgerPath: string) {
  const stream = fs.createReadStream(ledgerPath)
  const rl = readline.createInterface({ input: stream })
  
  for await (const line of rl) {
    yield JSON.parse(line) as SignedSpan
  }
}

// Verify
async function verifyLedger(ledgerPath: string, publicKeys: string[]) {
  let previousHash = null
  
  for await (const span of readLedger(ledgerPath)) {
    // 1. Verificar assinatura
    const valid = await verifySpan(span, { domain, publicKey })
    if (!valid) throw new Error(`Invalid signature: ${span.id}`)
    
    // 2. Verificar hash chain
    if (previousHash && span.previousHash !== previousHash) {
      throw new Error('Hash chain broken!')
    }
    
    previousHash = computeHash(span)
  }
  
  return { ok: true }
}
```

---

## 🔐 Criptografia

### BLAKE3 (Hashing)

**Por que BLAKE3?**
- Ultra-rápido (mais rápido que SHA-256)
- Paralelizável
- Seguro (baseado em ChaCha)
- Determinístico

```typescript
import { blake3 } from '@noble/hashes/blake3'

function computeHash(span: Span): string {
  // Canonical JSON para determinismo
  const canonical = canonicalize(span)
  const hash = blake3(canonical)
  return `blake3:${toHex(hash)}`
}
```

### Ed25519 (Assinatura)

**Por que Ed25519?**
- Rápido (muito mais que RSA)
- Assinaturas pequenas (64 bytes)
- Chaves pequenas (32 bytes)
- Resistente a timing attacks

```typescript
import { ed25519 } from '@noble/curves/ed25519'

async function signSpan(span: Span, opts: SignOptions) {
  const { domain, privateKey } = opts
  
  // 1. Computar hash do span
  const hash = computeHash(span)
  
  // 2. Domain separation
  const message = `${domain}:${hash}`
  
  // 3. Assinar
  const signature = await ed25519.sign(message, privateKey)
  
  return {
    ...span,
    signature: {
      alg: 'Ed25519',
      public_key: toHex(publicKey),
      sig: toHex(signature),
      signed_at: new Date().toISOString()
    }
  }
}
```

### Domain Separation

Sempre usamos **domain separation** para prevenir cross-protocol attacks:

```typescript
// ❌ Vulnerável
const sig = sign(hash, privateKey)

// ✅ Seguro
const message = `meu-app:v1:${hash}`
const sig = sign(message, privateKey)
```

---

## 🎛️ Políticas Computáveis

Políticas são regras determinísticas aplicadas aos spans.

### Tipos de Políticas

#### 1. TTL (Time To Live)

Rejeita spans muito antigos:

```typescript
interface TTLPolicy {
  type: 'ttl'
  ttlMs: number  // ex: 5 * 60 * 1000 (5 minutos)
}

function applyTTL(span: Span, policy: TTLPolicy): PolicyDecision {
  const age = Date.now() - span.meta.timestamp
  
  if (age > policy.ttlMs) {
    return {
      decision: 'deny',
      reason: `Span expired (age: ${age}ms, max: ${policy.ttlMs}ms)`
    }
  }
  
  return { decision: 'allow' }
}
```

#### 2. Throttle

Limita taxa de eventos:

```typescript
interface ThrottlePolicy {
  type: 'throttle'
  maxPerMinute: number
  keyFn: (span: Span) => string  // ex: span => span.body.userId
}

function applyThrottle(span: Span, policy: ThrottlePolicy): PolicyDecision {
  const key = policy.keyFn(span)
  const count = countLastMinute(key)
  
  if (count >= policy.maxPerMinute) {
    return {
      decision: 'deny',
      reason: `Rate limit exceeded (${count}/${policy.maxPerMinute})`
    }
  }
  
  return { decision: 'allow' }
}
```

#### 3. Retry

Reexecuta operações falhas:

```typescript
interface RetryPolicy {
  type: 'retry'
  maxAttempts: number
  backoffMs: number[]  // ex: [100, 500, 2000]
}

async function applyRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < policy.maxAttempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < policy.maxAttempts - 1) {
        await sleep(policy.backoffMs[i])
      }
    }
  }
  
  throw lastError
}
```

#### 4. Circuit Breaker

Previne cascata de falhas:

```typescript
interface CircuitBreakerPolicy {
  type: 'circuit_breaker'
  failureThreshold: number
  resetTimeoutMs: number
}

class CircuitBreaker {
  private failures = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private lastFailure = 0
  
  async execute<T>(fn: () => Promise<T>, policy: CircuitBreakerPolicy): Promise<T> {
    // Se aberto, falha rápido
    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailure
      if (elapsed < policy.resetTimeoutMs) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'half-open'
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure(policy)
      throw err
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }
  
  private onFailure(policy: CircuitBreakerPolicy) {
    this.failures++
    this.lastFailure = Date.now()
    
    if (this.failures >= policy.failureThreshold) {
      this.state = 'open'
    }
  }
}
```

---

## 📊 Observabilidade

### Logs Estruturados (Pino)

```typescript
import pino from 'pino'

const logger = pino({
  level: 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
})

// Uso
logger.info({ spanId, traceId }, 'Span created')
logger.error({ err, spanId }, 'Verification failed')
```

### Métricas (Prometheus)

```typescript
import { Counter, Histogram, register } from 'prom-client'

// Contadores
const spansCreated = new Counter({
  name: 'jsonatomic_spans_created_total',
  help: 'Total de spans criados',
  labelNames: ['type']
})

const spansVerified = new Counter({
  name: 'jsonatomic_spans_verified_total',
  help: 'Total de spans verificados',
  labelNames: ['valid']
})

// Histogramas (latência)
const signLatency = new Histogram({
  name: 'jsonatomic_sign_duration_seconds',
  help: 'Tempo para assinar span',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
})

// Uso
spansCreated.inc({ type: span.type })
const timer = signLatency.startTimer()
await signSpan(span, opts)
timer()
```

### Health Checks

```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    ledger: 'ok' | 'error'
    crypto: 'ok' | 'error'
    policies: 'ok' | 'error'
  }
  uptime: number
}

async function checkHealth(): Promise<HealthStatus> {
  return {
    status: 'healthy',
    checks: {
      ledger: await checkLedgerWritable() ? 'ok' : 'error',
      crypto: await checkCryptoKeys() ? 'ok' : 'error',
      policies: 'ok'
    },
    uptime: process.uptime()
  }
}
```

---

## 🏃 Execução

### Node.js

```typescript
// index.ts
export * from './core/span'
export * from './core/crypto'
export * from './core/ledger'
export * from './core/policies'
```

### Deno

```typescript
// Mesmo código, mas com imports explícitos
import { createSpan } from './core/span.ts'
import { signSpan } from './core/crypto.ts'
```

### Docker

```dockerfile
# Dockerfile (Node)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]

# Dockerfile.deno
FROM denoland/deno:alpine
WORKDIR /app
COPY . .
CMD ["deno", "run", "--allow-all", "index.ts"]
```

---

## 🔄 Integração com Outros Sistemas

### Export/Import

```typescript
// Export para diferentes formatos
async function exportLedger(format: 'ndjson' | 'json' | 'csv') {
  const spans = await readAllSpans('ledger.ndjson')
  
  switch (format) {
    case 'ndjson':
      return spans.map(s => JSON.stringify(s)).join('\n')
    case 'json':
      return JSON.stringify(spans, null, 2)
    case 'csv':
      return spansToCSV(spans)
  }
}
```

### SQL Integration

```sql
-- PostgreSQL: Criar tabela de spans
CREATE TABLE spans (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  body JSONB NOT NULL,
  meta JSONB,
  signature JSONB,
  previous_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexar por tipo e timestamp
CREATE INDEX idx_spans_type ON spans(type);
CREATE INDEX idx_spans_created ON spans(created_at);

-- Query de exemplo
SELECT 
  type,
  COUNT(*) as total,
  AVG((body->>'amount')::numeric) as avg_amount
FROM spans
WHERE type = 'payment.processed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY type;
```

---

## 🔒 Segurança

### Princípios

1. **Fail-fast**: Falhar cedo se configuração inválida
2. **Least privilege**: Apenas permissões necessárias
3. **Defense in depth**: Múltiplas camadas de segurança
4. **Audit everything**: Tudo deixa rastro

### Checklist

- [ ] Chaves em secret manager (não em código)
- [ ] Domain separation em todas assinaturas
- [ ] Validação de entrada (Zod schemas)
- [ ] Rate limiting ativo
- [ ] Logs estruturados
- [ ] Métricas e alertas
- [ ] Backups automáticos
- [ ] SBOM gerado e scanners ativos

---

## 📚 Referências

- [Overview](./overview.md) - Visão geral do projeto
- [Getting Started](./getting-started.md) - Primeiros passos
- [Security](./security.md) - Modelo de segurança
- [API Reference](./api/openapi.md) - Documentação da API

---

**JSON✯Atomic** — Arquitetura simples, poderosa e verificável.
