# Glossário - Termos Oficiais JSON✯Atomic

Definições dos termos técnicos usados no projeto.

---

## A

### AI-Native
Design pensado desde o início para funcionar bem com Large Language Models (LLMs). Características incluem: semântica clara, mensagens estruturadas, "promptability" (fácil de descrever para modelos), e exemplos prontos.

### Append-Only
Modelo de armazenamento onde dados só podem ser adicionados, nunca modificados ou deletados. Garante imutabilidade e trilha auditável completa.

### Atomic Unit
Sinônimo de [Span](#span). Uma unidade atômica, indivisível e auto-contida de execução ou evento.

### Auditoria
Processo de verificar a integridade, autenticidade e completude de um ledger usando assinaturas digitais e hash chains.

---

## B

### BLAKE3
Função de hash criptográfico moderna, ultra-rápida e paralelizável. Usada em JSON✯Atomic para computar hashes de spans e construir hash chains.

**Por que BLAKE3?**
- Mais rápido que SHA-256
- Paralelizável (multi-core)
- Seguro e moderno
- Determinístico

### Body
Campo do [Span](#span) que contém o payload/dados do evento. Estrutura livre (JSON), definida pelo tipo do evento.

```typescript
{
  type: 'user.created',
  body: {           // ← Body
    userId: 'u123',
    email: 'user@example.com'
  }
}
```

---

## C

### Canonical JSON
Representação JSON normalizada e determinística. Garante que a mesma estrutura sempre produza a mesma string, essencial para hashing e assinaturas consistentes.

### Circuit Breaker
Política que previne cascata de falhas. Abre circuito após N falhas consecutivas, falhando rápido e evitando sobrecarga.

### Criptografia de Curva Elíptica (ECC)
Base do algoritmo Ed25519. Oferece mesma segurança que RSA com chaves muito menores.

---

## D

### Domain Separation
Técnica de segurança que inclui contexto ao assinar mensagens, prevenindo ataques cross-protocol. 

Exemplo:
```typescript
// Ao invés de: sign(hash, key)
sign(`json-atomic:v1:${domain}:${hash}`, key)
```

---

## E

### Ed25519
Algoritmo de assinatura digital baseado em curvas elípticas. Usado em JSON✯Atomic para assinar e verificar spans.

**Vantagens**:
- Rápido
- Chaves pequenas (32 bytes)
- Assinaturas pequenas (64 bytes)
- Resistente a timing attacks

### Event Sourcing
Padrão arquitetural onde mudanças de estado são armazenadas como sequência de eventos imutáveis. JSON✯Atomic facilita esse padrão com ledger append-only e verificável.

---

## F

### Fail-Fast
Princípio de design onde erros são detectados e sinalizados o mais cedo possível, prevenindo estados inválidos ou corrupção de dados.

### Fork
Divergência no ledger onde hash chain se divide em dois caminhos. Detectado durante verificação de integridade.

```
Span 1 → Span 2 → Span 3
              ↘
                Span 3' (fork detectado!)
```

---

## H

### Hash
Valor de tamanho fixo derivado de dados de entrada usando função hash criptográfica (BLAKE3 em JSON✯Atomic).

### Hash Chain
Estrutura onde cada span referencia o hash do span anterior, criando cadeia verificável. Qualquer modificação quebra a cadeia.

```
[Span 1] → hash1
[Span 2, prevHash: hash1] → hash2
[Span 3, prevHash: hash2] → hash3
```

---

## I

### Imutabilidade
Propriedade de dados que não podem ser modificados após criação. Core do modelo append-only de JSON✯Atomic.

### Integridade
Garantia de que dados não foram adulterados. Em JSON✯Atomic, verificada através de assinaturas digitais e hash chains.

---

## L

### Ledger
Registro append-only de todos os spans. Em JSON✯Atomic, tipicamente armazenado em formato NDJSON.

### LLM (Large Language Model)
Modelo de linguagem grande (ex: GPT-4, Claude). JSON✯Atomic é AI-native, facilitando integração com LLMs.

---

## M

### Meta (Metadata)
Campo opcional do [Span](#span) contendo metadados como traceId, timestamp, parentId, etc.

```typescript
{
  meta: {
    traceId: 'trace-123',
    timestamp: 1699564800000,
    parentId: 'span-parent',
    source: 'api-gateway'
  }
}
```

---

## N

### NDJSON (Newline Delimited JSON)
Formato onde cada linha é um objeto JSON válido, separado por quebra de linha. Formato padrão do ledger JSON✯Atomic.

```ndjson
{"id":"1","type":"user.created"}
{"id":"2","type":"payment.processed"}
```

**Vantagens**:
- Streaming eficiente
- Fácil append
- Compatível com ferramentas Unix
- Portável

---

## O

### Observabilidade
Capacidade de entender estado interno de um sistema através de suas saídas (logs, métricas, traces). JSON✯Atomic oferece observabilidade built-in com Prometheus e structured logging.

---

## P

### Política (Policy)
Regra computável aplicada a spans para governança, compliance ou controle de fluxo.

**Tipos**:
- **TTL**: Time-to-live
- **Throttle**: Limitação de taxa
- **Retry**: Tentativas automáticas
- **Circuit Breaker**: Prevenção de cascata

### Proof (Prova Criptográfica)
Evidência matemática de que dados são autênticos e não foram adulterados. Em JSON✯Atomic: assinatura Ed25519 + hash BLAKE3.

---

## R

### Replay Attack
Ataque onde adversário captura mensagem válida e reenvia posteriormente. Prevenido com políticas de TTL e nonces únicos.

### Rotação de Chaves
Processo de substituir chaves criptográficas periodicamente. JSON✯Atomic suporta múltiplas chaves públicas para rotação sem downtime.

---

## S

### Schema Version
Versão do schema de dados do span. Atualmente "1.1.0". Permite evolução controlada do formato.

### Signature (Assinatura)
Prova criptográfica de autenticidade e integridade, gerada com chave privada Ed25519 e verificável com chave pública correspondente.

```typescript
{
  signature: {
    alg: 'Ed25519',
    public_key: 'hex...',
    sig: 'hex...',
    signed_at: '2024-11-09T12:00:00Z'
  }
}
```

### Span
Unidade fundamental de JSON✯Atomic. Representa um evento atômico, estruturado e assinável.

**Componentes principais**:
- `id`: Identificador único (UUID v4)
- `type`: Tipo do evento
- `body`: Payload de dados
- `meta`: Metadados opcionais
- `signature`: Assinatura digital
- `previousHash`: Hash do span anterior (hash chain)

### Supply Chain Attack
Ataque onde dependências de software são comprometidas. JSON✯Atomic mitiga com: lockfiles, Dependabot, npm audit, SBOM, OSV-Scanner.

---

## T

### Throttle
Política que limita taxa de eventos (ex: máximo 100 req/min por usuário).

### Timestamp
Marca temporal em milissegundos (Unix epoch). Incluída em `meta.timestamp`.

### TraceId
Identificador único para rastrear operação distribuída através de múltiplos serviços/spans. Facilita debugging.

### TTL (Time To Live)
Política que rejeita spans muito antigos, prevenindo replay attacks e processamento de eventos obsoletos.

---

## U

### Universal Language (Língua Universal)
JSON canônico como protocolo comum entre sistemas heterogêneos. Core value proposition de JSON✯Atomic.

### UUID (Universally Unique Identifier)
Identificador único de 128 bits. JSON✯Atomic usa UUID v4 para IDs de spans.

---

## V

### Verificação
Processo de validar autenticidade e integridade de um span usando assinatura Ed25519 e domain separation.

```typescript
const valid = await verifySpan(span, { domain, publicKey })
```

### Versioning
Sistema de versionamento semântico (semver) usado em JSON✯Atomic: `MAJOR.MINOR.PATCH`.

---

## Símbolos

### JSON✯Atomic
Nome oficial do projeto. A estrela (✯) representa:
- Brilho/destaque
- Universalidade (estrelas guiam)
- AI-native (estrelas = guidance)

Variação aceita: "JSON Atomic" (sem estrela) no corpo do texto.

---

## Referências Técnicas

### RFC/Standards

- **Ed25519**: [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)
- **BLAKE3**: [Specification](https://github.com/BLAKE3-team/BLAKE3-specs)
- **UUID**: [RFC 4122](https://www.rfc-editor.org/rfc/rfc4122)
- **JSON**: [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)
- **NDJSON**: [ndjson.org](http://ndjson.org/)

### Bibliotecas

- **@noble/curves**: Implementação Ed25519
- **@noble/hashes**: Implementação BLAKE3
- **Zod**: Schema validation
- **Pino**: Structured logging
- **prom-client**: Prometheus metrics

---

## Convenções de Nomenclatura

### Caso de Uso por Contexto

| Contexto | Formato | Exemplo |
|----------|---------|---------|
| Títulos de documentos | JSON✯Atomic | "JSON✯Atomic - Overview" |
| Código/variáveis | jsonAtomic | `const jsonAtomic = ...` |
| URLs/slugs | json-atomic | `github.com/.../json-atomic` |
| Texto corrido | JSON Atomic | "JSON Atomic é um backend..." |

---

## Termos Banidos

⛔ **LogLineOS** — Nome anterior do projeto, não deve ser usado.

✅ Use: "JSON✯Atomic" ou "backend leve e universal, AI-native"

---

**Atualizado**: 2024-11-09  
**Versão**: 1.1.0

Para mais detalhes técnicos, consulte:
- [Architecture](docs/architecture.md)
- [Getting Started](docs/getting-started.md)
- [Security](docs/security.md)
