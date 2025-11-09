<div align="center">

# JSON✯Atomic

### 🚀 O backend leve e universal que fala a língua da IA

**Integridade verificável • Políticas inteligentes • Zero configuração**

[![Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/danvoulez/Json-Atomic)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/danvoulez/Json-Atomic)
[![Security](https://img.shields.io/badge/security-hardened-brightgreen)](SECURITY.md)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)](tsconfig.json)

[🎯 Quickstart](#-quickstart--node) • [📚 Documentação](#-sumário) • [🌟 Diferenciais](#-diferenciais-técnicos) • [🎪 Playground](playground/) • [💬 FAQ](#-faq)

</div>

---

## 💡 O que é JSON✯Atomic?

**JSON✯Atomic é o backend que você sempre quis**: leve, portável e pronto para IA. 

Transforme seus eventos em **provas criptográficas verificáveis** em minutos. Cada operação é assinada, rastreável e auditável — perfeito para sistemas que precisam de **confiança zero** e **transparência total**.

### 🎯 Em 3 passos você está rodando:
1. ⚡ Clone e instale em **< 2 minutos**
2. 🔐 Gere suas chaves Ed25519 automaticamente  
3. ✨ Crie, assine e verifique spans com provas criptográficas

> **"JSON canônico + criptografia de ponta = backend à prova de adulteração"**

---

## 🌟 Por que JSON✯Atomic?

### Você está cansado de backends complexos que:
- ❌ Exigem dias de configuração
- ❌ Não garantem integridade dos dados
- ❌ São incompatíveis com LLMs e automação
- ❌ Têm rastros de auditoria fracos ou inexistentes

### ✅ JSON✯Atomic resolve tudo isso:

<table>
<tr>
<td width="50%">

#### 🌍 **Língua Universal**
JSON canônico que apps e LLMs entendem nativamente. Sem fricção, sem parsing especial, sem surpresas.

#### 🔒 **Integridade Garantida**  
BLAKE3 + Ed25519 em **cada evento**. Detecção automática de adulterações e forks na cadeia.

#### 📝 **Ledger Simples**
NDJSON append-only. Versionável com git, replicável com rsync. Sem banco de dados exótico.

</td>
<td width="50%">

#### ⚙️ **Políticas Inteligentes**
TTL, throttle, retry, slow-mode — tudo computável e rastreável. Automação que você controla.

#### 📊 **Observabilidade Nativa**
Métricas Prometheus, logs estruturados com traceId, health checks prontos. Zero configuração.

#### 🚀 **Deploy Instantâneo**
Node **ou** Deno. Container simples. Binário único. Roda onde você quiser.

</td>
</tr>
</table>

### 🎯 Use Cases Reais

- **🤖 Integração com LLMs**: Histórico de conversas com provas criptográficas
- **📋 Auditoria Compliance**: Trilha imutável para SOC2, ISO27001, LGPD
- **🔄 Sistemas Distribuídos**: Sincronização com verificação de integridade
- **🎮 Gaming**: Eventos de jogo verificáveis e anti-cheat
- **💰 Fintech**: Logs de transações à prova de adulteração
- **🏥 Healthcare**: Histórico médico com garantias criptográficas

---

## ✨ Diferenciais Técnicos

- 🌍 **Língua universal** para apps e LLMs (JSON canônico, estável, "promptable")
- 🔒 **Integridade verificável**: BLAKE3 + Ed25519 por evento e por lote
- 📝 **Ledger append-only** em NDJSON — simples de ler, versionar, replicar
- ⚙️ **Políticas computáveis** (ex.: TTL, throttle, retry, slow-mode), com rastro
- 📊 **Observabilidade pronta**: métricas, health e logs estruturados com traceId
- 🚀 **Portável de verdade**: Node ou Deno; containers simples
- 💻 **DX sério**: quickstart em 5–10 min, exemplos copy-paste e fail-fast para configs

---

## 🧭 Sumário

- [Instalação & Requisitos](#-instalação--requisitos)
- [Quickstart — Node](#-quickstart--node)
- [Quickstart — Deno](#-quickstart--deno)
- [Exemplos práticos](#-exemplos-práticos)
  - [1) Criar → assinar → verificar um span](#1-criar--assinar--verificar-um-span)
  - [2) Append em NDJSON + verificação em lote](#2-append-em-ndjson--verificação-em-lote)
  - [3) Política TTL em ação](#3-política-ttl-em-ação)
- [API REST (opcional)](#-api-rest-opcional)
- [Arquitetura (visão rápida)](#-arquitetura-visão-rápida)
- [Segurança & Supply Chain](#-segurança--supply-chain)
- [Roadmap](#️-roadmap)
- [FAQ](#-faq)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🛠 Instalação & Requisitos

### Requisitos mínimos
- ✅ Node 18+ ou Deno 1.45+
- ✅ Docker (opcional)
- ✅ make, git (opcional para scripts/conveniências)

### Clonar o repositório

```bash
git clone https://github.com/danvoulez/Json-Atomic json-atomic
cd json-atomic
```

### Instalar dependências (Node)

```bash
# use PNPM (recomendado) ou NPM/Yarn
pnpm install
pnpm build
```

> **Nota**: Se for consumir como pacote NPM, use `npm i json-atomic` e ajuste os imports nos exemplos para o nome do pacote. Neste README, os imports locais aparecem como `from './index'` apenas como referência.

---

## ⚡ Quickstart — Node

### 1) Gerar/definir chave (dev)

```bash
# Exemplo rápido com Node (gera par Ed25519 em JSON para dev)
node scripts/generate-keys.js  # (ou use um script seu)
# Salve a chave privada com segurança; em produção, rotacione periodicamente.
```

### 2) Primeiro span (criar → assinar → verificar)

```typescript
// examples/node/hello.ts
import { createSpan, signSpan, verifySpan } from './index' // ajuste p/ json-atomic se for pacote

const domain = 'demo-json-atomic'
const { publicKey, privateKey } = /* carregue sua chave Ed25519 */

const span = createSpan({
  type: 'demo.event',
  body: { message: 'hello, json-atomic!' },
  meta: { traceId: 'trace-' + Date.now() }
})

const signed = await signSpan(span, { domain, privateKey })
const ok = await verifySpan(signed, { domain, publicKey })

console.log({ ok, spanId: signed.id })
if (!ok) process.exit(1)
```

```bash
node --loader ts-node/esm examples/node/hello.ts
# ou: ts-node examples/node/hello.ts
```

---

## ⚡ Quickstart — Deno

### API mínima em Deno (Oak)

```bash
# Executa API REST mínima (ajuste permissões conforme seu ambiente)
deno run --allow-net --allow-env --allow-read=. api/restApi.ts
```

> Por padrão, a API lê `API_KEY` do ambiente. Em produção, falhe cedo (fail-fast) se `API_KEY` estiver ausente.

### Cliente Deno simples

```typescript
// examples/deno/hello.ts
import { createSpan, signSpan, verifySpan } from '../index.ts' // ajuste conforme layout

const domain = 'demo-json-atomic'
const { publicKey, privateKey } = /* carregar chaves */

const span = createSpan({ type: 'demo.event', body: { ok: true } })
const signed = await signSpan(span, { domain, privateKey })
const ok = await verifySpan(signed, { domain, publicKey })

console.log({ ok })
```

```bash
deno run --allow-read=./ examples/deno/hello.ts
```

---

## 🧪 Exemplos práticos

### 1) Criar → assinar → verificar um span

```typescript
import { createSpan, signSpan, verifySpan } from './index'

const domain = 'example'
const keys = { publicKey, privateKey } // carregue do seu keystore seguro

const span = createSpan({
  type: 'user.created',
  body: { id: 'u_123', plan: 'pro' },
  meta: { traceId: 't-' + crypto.randomUUID() }
})

const signed = await signSpan(span, { domain, privateKey: keys.privateKey })
const valid = await verifySpan(signed, { domain, publicKey: keys.publicKey })
console.log('valid?', valid)
```

### 2) Append em NDJSON + verificação em lote

```typescript
import { toNDJSON, verifyLedgerFile } from './index'
import { writeFileSync } from 'node:fs'

const spans = [/* ...spans assinados... */]
const ndjson = spans.map(toNDJSON).join('\n') + '\n'
writeFileSync('ledger.ndjson', ndjson)

const result = await verifyLedgerFile('ledger.ndjson', {
  domain: 'example',
  publicKeys: [keys.publicKey] // suporta rotação
})
console.log(result.summary) // { total, valid, invalid, forks, hashChain }
if (!result.ok) process.exit(1)
```

### 3) Política TTL em ação

```typescript
import { applyPolicy } from './index'

const ttlMs = 5 * 60 * 1000
const { decision, reason } = applyPolicy('ttl', {
  span: signedSpan,
  now: Date.now(),
  config: { ttlMs }
})

if (decision === 'deny') {
  console.error('TTL expired:', reason)
  process.exit(1)
}
```

> **Dica**: políticas típicas incluem `ttl`, `throttle`, `retry`, `slow-mode` e `circuit-breaker`. Todas deixam rastro no ledger para auditoria.

---

## 🌐 API REST (opcional)

Roda em Node ou Deno. Se preferir Deno, use o `Dockerfile.deno` oficial.

### Node (exemplo de bootstrap mínimo)

```typescript
import http from 'node:http'
import { createSpan, signSpan } from './index'

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/spans') {
    const body = await new Response(req).json()
    const span = createSpan(body)
    const signed = await signSpan(span, { domain: 'api', privateKey: process.env.PRIVATE_KEY! })
    res.writeHead(201, { 'content-type': 'application/json' })
    res.end(JSON.stringify(signed))
  } else {
    res.writeHead(404).end()
  }
})

server.listen(8000, () => console.log('API on :8000'))
```

### Deno (Oak)

```bash
deno run --allow-net --allow-env --allow-read=. api/restApi.ts
```

### Variáveis de ambiente
- `API_KEY` (requerida em produção)
- `PRIVATE_KEY` / `PUBLIC_KEY` (ou arquivo/keystore)
- `PORT` (default: 8000)

---

## 🧩 Arquitetura (visão rápida)

```
          +-------------------+         +------------------+
Clients ⇄ |  API (Node/Deno)  |  ⇄⇄⇄    |  Policy Agent    |
          +-------------------+         +------------------+
                    |                           |
                    v                           v
             +---------------------+     +------------------+
             |   Ledger NDJSON     | <-- |  Observer/Bots   |
             |  (append-only)      |     +------------------+
             +----------+----------+
                        |
                        v
               +---------------+
               | Verificador   |  (BLAKE3 + Ed25519, hash chain,
               | (streaming)   |   forks, proofs, rot. de chaves)
               +---------------+
```

---

## 🔐 Segurança & Supply Chain

- **Cripto**: BLAKE3 para hashing; Ed25519 para assinaturas; domain separation em todas as assinaturas
- **Chaves**: gere e rote chaves regularmente; armazene em HSM/secret manager
- **Fail-fast**: em produção, não subir sem `API_KEY` e materiais de chave válidos
- **SBOM/Análise**: gere CycloneDX e rode OSV-Scanner no CI
- **Política de reporte**: consulte [SECURITY.md](SECURITY.md)

---

## 🗺️ Roadmap

- ⚡ Benchmarks e testes de carga (append/verify streaming)
- 📊 Exemplos de observabilidade com métricas e logs estruturados
- 🔄 Políticas adicionais (quota por tenant, circuit-breaker com backoff)
- 🤖 Integrações "one-click" com LLMs (mensagem ⇄ span)
- 🔒 Atestações (SLSA) nas imagens e pacotes

---

## ❓ FAQ

### Q: Isso substitui meu banco?
**A:** Não. Ele provê rastro verificável e linguagem de integração/automação. Guarde seus dados onde quiser e use o ledger como fonte de verdade auditável.

### Q: Posso usar só com Node ou só com Deno?
**A:** Sim. O projeto é portável — escolha o runtime que preferir.

### Q: Como rodo com Docker?
**A:**
- **Node**: `docker build -t json-atomic -f Dockerfile . && docker run --rm -p 8000:8000 json-atomic`
- **Deno**: `docker build -t json-atomic-deno -f Dockerfile.deno . && docker run --rm -p 8000:8000 json-atomic-deno`

### Q: Como garanto que ninguém alterou meu ledger?
**A:** O verificador reconstrói a hash chain e valida assinaturas Ed25519. Qualquer alteração quebra a cadeia e é detectada.

---

## 🤝 Contribuição

1. `pnpm i && pnpm build`
2. `pnpm lint && pnpm test` (thresholds habilitados)
3. Abra PR com descrição clara, casos de teste e sem segredos
4. Use CODEOWNERS e o template de PR
5. Para vulnerabilidades, não abra issue pública — use o canal de [SECURITY.md](SECURITY.md)

---

## 📄 Licença

MIT — veja [LICENSE](LICENSE).

---

## 🌎 EN (short pitch)

**JSON✯Atomic** is a lightweight, versatile backend that speaks a universal language (canonical JSON) and is AI-native. In minutes, you create spans, sign, verify, and run policies with an append-only ledger and end-to-end cryptographic proofs.

### Key Features:
- 🔒 **Cryptographic integrity**: BLAKE3 + Ed25519 signatures
- 📝 **Simple ledger**: NDJSON append-only format
- 🌍 **Universal language**: Canonical JSON for apps and LLMs
- ⚙️ **Smart policies**: TTL, throttle, retry, slow-mode
- 🚀 **Portable**: Node.js or Deno, Docker-ready
- 📊 **Observable**: Prometheus metrics, structured logs, health checks

Perfect for audit trails, LLM integrations, distributed systems, compliance, and any application requiring verifiable data integrity.

---

<div align="center">

**⭐ Star us on GitHub • 🐛 Report Issues • 💡 Contribute**

Made with ❤️ by the JSON✯Atomic Team

</div>
