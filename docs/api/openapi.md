# API Reference - JSON✯Atomic

Este documento descreve a API HTTP REST do JSON✯Atomic e contratos de dados.

---

## 🌐 Visão Geral

JSON✯Atomic expõe uma API REST simples e eficiente para:
- Criar e assinar spans
- Consultar ledger
- Verificar integridade
- Aplicar políticas
- Monitorar saúde do sistema

**Base URL (desenvolvimento)**: `http://localhost:8000`  
**Base URL (produção)**: `https://api.jsonatomic.dev` (configurável)

**Formato**: JSON  
**Autenticação**: API Key (header `X-API-Key`)  
**Versão**: v1.1.0

---

## 🔐 Autenticação

Todas as requisições (exceto `/health`) requerem API Key:

```bash
curl -H "X-API-Key: your-api-key-here" \
  http://localhost:8000/api/spans
```

**Desenvolvimento**:
```bash
export API_KEY=dev-key-123
```

**Produção**:
- Gere chave segura: `openssl rand -hex 32`
- Armazene em secret manager
- Rotacione periodicamente

---

## 📋 Endpoints

### Health Check

**GET** `/health`

Verifica saúde do sistema (não requer autenticação).

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "1.1.0",
  "uptime": 3600,
  "checks": {
    "ledger": "ok",
    "crypto": "ok",
    "policies": "ok"
  }
}
```

**Estados possíveis**:
- `healthy`: Tudo funcionando
- `degraded`: Alguns componentes com problemas
- `unhealthy`: Sistema inoperante

---

### Criar Span

**POST** `/api/spans`

Cria e assina um novo span.

**Headers**:
```
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body**:
```json
{
  "type": "user.created",
  "body": {
    "userId": "u_12345",
    "email": "user@example.com",
    "plan": "pro"
  },
  "meta": {
    "traceId": "trace-abc-123",
    "source": "web-app"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "user.created",
  "schema_version": "1.1.0",
  "body": {
    "userId": "u_12345",
    "email": "user@example.com",
    "plan": "pro"
  },
  "meta": {
    "traceId": "trace-abc-123",
    "source": "web-app",
    "timestamp": 1699564800000
  },
  "signature": {
    "alg": "Ed25519",
    "public_key": "302a300506032b657003210...",
    "sig": "5a7d8f9e3c2b1a...",
    "signed_at": "2024-11-09T12:00:00Z"
  },
  "previousHash": "blake3:abc123..."
}
```

**Errors**:
- `400 Bad Request`: Payload inválido
- `401 Unauthorized`: API Key ausente/inválida
- `422 Unprocessable Entity`: Validação falhou

---

### Obter Span

**GET** `/api/spans/:id`

Recupera span por ID.

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "user.created",
  "body": { ... },
  "signature": { ... }
}
```

**Errors**:
- `404 Not Found`: Span não existe

---

### Listar Spans

**GET** `/api/spans`

Lista spans com paginação e filtros.

**Query Parameters**:
- `type` (opcional): Filtrar por tipo (ex: `user.created`)
- `traceId` (opcional): Filtrar por trace ID
- `limit` (opcional): Número de resultados (padrão: 50, max: 100)
- `offset` (opcional): Offset para paginação

**Exemplo**:
```bash
curl -H "X-API-Key: xxx" \
  "http://localhost:8000/api/spans?type=payment.processed&limit=10"
```

**Response** (200 OK):
```json
{
  "spans": [
    { "id": "...", "type": "payment.processed", ... },
    { "id": "...", "type": "payment.processed", ... }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Verificar Span

**POST** `/api/verify/span`

Verifica assinatura de um span.

**Request Body**:
```json
{
  "span": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "user.created",
    "body": { ... },
    "signature": { ... }
  },
  "domain": "my-app"
}
```

**Response** (200 OK):
```json
{
  "valid": true,
  "spanId": "550e8400-e29b-41d4-a716-446655440000",
  "verifiedAt": "2024-11-09T12:01:00Z"
}
```

**Response** (200 OK - inválido):
```json
{
  "valid": false,
  "spanId": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "Invalid signature"
}
```

---

### Verificar Ledger

**POST** `/api/verify/ledger`

Verifica integridade completa do ledger (hash chain + assinaturas).

**Request Body**:
```json
{
  "ledgerPath": "ledger.ndjson",
  "domain": "my-app"
}
```

**Response** (200 OK):
```json
{
  "ok": true,
  "summary": {
    "total": 1000,
    "valid": 1000,
    "invalid": 0,
    "hashChainIntact": true,
    "forks": 0
  },
  "verifiedAt": "2024-11-09T12:05:00Z"
}
```

**Response** (200 OK - problemas):
```json
{
  "ok": false,
  "summary": {
    "total": 1000,
    "valid": 998,
    "invalid": 2,
    "hashChainIntact": false,
    "forks": 1
  },
  "errors": [
    {
      "type": "invalid_signature",
      "spanId": "abc-123",
      "index": 45
    },
    {
      "type": "hash_chain_broken",
      "spanId": "def-456",
      "index": 500,
      "expected": "blake3:xxx",
      "actual": "blake3:yyy"
    }
  ]
}
```

---

### Aplicar Política

**POST** `/api/policies/apply`

Aplica política a um span.

**Request Body**:
```json
{
  "span": {
    "id": "...",
    "type": "user.created",
    "meta": { "timestamp": 1699564800000 }
  },
  "policy": {
    "type": "ttl",
    "ttlMs": 300000
  }
}
```

**Response** (200 OK - permitido):
```json
{
  "decision": "allow",
  "spanId": "...",
  "policy": "ttl"
}
```

**Response** (200 OK - negado):
```json
{
  "decision": "deny",
  "reason": "Span expired (age: 600000ms, max: 300000ms)",
  "spanId": "...",
  "policy": "ttl"
}
```

---

### Métricas (Prometheus)

**GET** `/metrics`

Exporta métricas no formato Prometheus (não requer autenticação).

**Response** (200 OK):
```
# HELP jsonatomic_spans_created_total Total de spans criados
# TYPE jsonatomic_spans_created_total counter
jsonatomic_spans_created_total{type="user.created"} 150
jsonatomic_spans_created_total{type="payment.processed"} 75

# HELP jsonatomic_sign_duration_seconds Tempo para assinar span
# TYPE jsonatomic_sign_duration_seconds histogram
jsonatomic_sign_duration_seconds_bucket{le="0.001"} 50
jsonatomic_sign_duration_seconds_bucket{le="0.005"} 95
jsonatomic_sign_duration_seconds_bucket{le="0.01"} 100
```

---

## 📊 Modelos de Dados

### Span

```typescript
interface Span {
  id: string                    // UUID v4
  type: string                  // Tipo do evento (ex: "user.created")
  schema_version: string        // "1.1.0"
  body: Record<string, any>     // Payload do evento
  meta?: SpanMeta               // Metadados opcionais
  signature?: Signature         // Assinatura (adicionada após signSpan)
  previousHash?: string         // Hash do span anterior
}
```

### SpanMeta

```typescript
interface SpanMeta {
  traceId?: string      // Para distributed tracing
  parentId?: string     // ID do span pai
  timestamp?: number    // Unix timestamp em ms
  source?: string       // Origem do evento
  [key: string]: any    // Campos customizados
}
```

### Signature

```typescript
interface Signature {
  alg: 'Ed25519'        // Algoritmo de assinatura
  public_key: string    // Chave pública em hex
  sig: string           // Assinatura em hex
  signed_at: string     // ISO 8601 timestamp
}
```

### Policy

```typescript
type Policy = 
  | { type: 'ttl', ttlMs: number }
  | { type: 'throttle', maxPerMinute: number, keyFn?: string }
  | { type: 'retry', maxAttempts: number, backoffMs: number[] }
  | { type: 'circuit_breaker', failureThreshold: number, resetTimeoutMs: number }
```

---

## 🔒 Segurança da API

### Rate Limiting

Por padrão:
- **100 requests/min** por IP
- **1000 requests/min** por API Key

Headers de resposta:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564860
```

### CORS

Configurável via variáveis de ambiente:

```bash
CORS_ORIGIN=https://app.example.com
CORS_METHODS=GET,POST
CORS_HEADERS=Content-Type,X-API-Key
```

### Content Security Policy

```
Content-Security-Policy: default-src 'self'; script-src 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

---

## 🧪 Exemplos de Uso

### cURL

```bash
# Criar span
curl -X POST http://localhost:8000/api/spans \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-123" \
  -d '{
    "type": "test.event",
    "body": { "message": "Hello, JSON✯Atomic!" }
  }'

# Listar spans
curl -H "X-API-Key: dev-key-123" \
  "http://localhost:8000/api/spans?limit=5"

# Health check
curl http://localhost:8000/health
```

### JavaScript (Fetch)

```javascript
const response = await fetch('http://localhost:8000/api/spans', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'dev-key-123'
  },
  body: JSON.stringify({
    type: 'user.signup',
    body: {
      userId: 'u_123',
      email: 'user@example.com'
    }
  })
})

const span = await response.json()
console.log('Span created:', span.id)
```

### Python (Requests)

```python
import requests

response = requests.post(
    'http://localhost:8000/api/spans',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'dev-key-123'
    },
    json={
        'type': 'data.processed',
        'body': {
            'records': 1000,
            'duration_ms': 123
        }
    }
)

span = response.json()
print(f"Span ID: {span['id']}")
```

---

## 📝 OpenAPI Specification

Especificação OpenAPI completa disponível em:

**Arquivo**: `schemas/openapi.yaml`  
**Swagger UI**: `http://localhost:8000/api-docs` (se habilitado)

---

## 🚀 SDK Oficial

SDK TypeScript/JavaScript disponível:

```bash
npm install @jsonatomic/sdk
```

```typescript
import { JsonAtomicClient } from '@jsonatomic/sdk'

const client = new JsonAtomicClient({
  baseUrl: 'http://localhost:8000',
  apiKey: process.env.API_KEY
})

const span = await client.createSpan({
  type: 'user.created',
  body: { userId: 'u_123' }
})

console.log('Created:', span.id)
```

---

## 📚 Referências

- [Getting Started](./getting-started.md)
- [Architecture](./architecture.md)
- [Security](./security.md)
- [Schemas](../../schemas/)

---

**JSON✯Atomic API** — Simples, poderosa e segura.
