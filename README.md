JSON✯Atomic — O backend leve e universal (AI-native)

Pitch (2 linhas):
JSON✯Atomic é um backend leve e versátil que fala uma língua universal (JSON canônico) e é AI-native. Em minutos, você gera spans, assina, verifica e opera políticas com trilha auditável e provas criptográficas ponta-a-ponta.

<!-- Badges (opcional) -->


<!-- ![CI](https://img.shields.io/badge/CI-passing-brightgreen) ![License: MIT](https://img.shields.io/badge/License-MIT-blue) -->



⸻

✨ Diferenciais
	•	Língua universal para apps e LLMs (JSON canônico, estável, “promptable”).
	•	Integridade verificável: BLAKE3 + Ed25519 por evento e por lote.
	•	Ledger append-only em NDJSON — simples de ler, versionar, replicar.
	•	Políticas computáveis (ex.: TTL, throttle, retry, slow-mode), com rastro.
	•	Observabilidade pronta: métricas, health e logs estruturados com traceId.
	•	Portável de verdade: Node ou Deno; containers simples.
	•	DX sério: quickstart em 5–10 min, exemplos copy-paste e fail-fast para configs.

⸻

🧭 Sumário
	•	Instalação & Requisitos￼
	•	Quickstart — Node￼
	•	Quickstart — Deno￼
	•	Exemplos práticos￼
	•	1) Criar → assinar → verificar um span￼
	•	2) Append em NDJSON + verificação em lote￼
	•	3) Política TTL em ação￼
	•	API REST (opcional)￼
	•	Arquitetura (visão rápida)￼
	•	Segurança & Supply Chain￼
	•	Roadmap￼
	•	FAQ￼
	•	Contribuição￼
	•	Licença￼

⸻

🛠 Instalação & Requisitos

Requisitos mínimos
	•	Node 18+ ou Deno 1.45+
	•	Docker (opcional)
	•	make, git (opcional para scripts/conveniências)

Clonar o repositório

git clone {REPO_URL} json-atomic
cd json-atomic

Instalar dependências (Node)

# use PNPM (recomendado) ou NPM/Yarn
pnpm install
pnpm build

Nota: Se for consumir como pacote NPM, use npm i {NPM_NAME} e ajuste os imports nos exemplos para o nome do pacote. Neste README, os imports locais aparecem como from './index' apenas como referência.

⸻

⚡ Quickstart — Node

1) Gerar/definir chave (dev)

# Exemplo rápido com Node (gera par Ed25519 em JSON para dev)
node scripts/generate-keys.js  # (ou use um script seu)
# Salve a chave privada com segurança; em produção, rotacione periodicamente.

2) Primeiro span (criar → assinar → verificar)

// examples/node/hello.ts
import { createSpan, signSpan, verifySpan } from './index' // ajuste p/ {NPM_NAME} se for pacote

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

node --loader ts-node/esm examples/node/hello.ts
# ou: ts-node examples/node/hello.ts


⸻

⚡ Quickstart — Deno

API mínima em Deno (Oak)

# Executa API REST mínima (ajuste permissões conforme seu ambiente)
deno run --allow-net --allow-env --allow-read=. api/restApi.ts

Por padrão, a API lê API_KEY do ambiente. Em produção, falhe cedo (fail-fast) se API_KEY estiver ausente.

Cliente Deno simples

// examples/deno/hello.ts
import { createSpan, signSpan, verifySpan } from '../index.ts' // ajuste conforme layout

const domain = 'demo-json-atomic'
const { publicKey, privateKey } = /* carregar chaves */

const span = createSpan({ type: 'demo.event', body: { ok: true } })
const signed = await signSpan(span, { domain, privateKey })
const ok = await verifySpan(signed, { domain, publicKey })

console.log({ ok })

deno run --allow-read=./ examples/deno/hello.ts


⸻

🧪 Exemplos práticos

1) Criar → assinar → verificar um span

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

2) Append em NDJSON + verificação em lote

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

3) Política TTL em ação

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

Dica: políticas típicas incluem ttl, throttle, retry, slow-mode e circuit-breaker. Todas deixam rastro no ledger para auditoria.

⸻

🌐 API REST (opcional)

Roda em Node ou Deno. Se preferir Deno, use o Dockerfile.deno oficial.

Node (exemplo de bootstrap mínimo)

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

Deno (Oak)

deno run --allow-net --allow-env --allow-read=. api/restApi.ts

Variáveis de ambiente
	•	API_KEY (requerida em produção)
	•	PRIVATE_KEY / PUBLIC_KEY (ou arquivo/keystore)
	•	PORT (default: 8000)

⸻

🧩 Arquitetura (visão rápida)

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


⸻

🔐 Segurança & Supply Chain
	•	Cripto: BLAKE3 para hashing; Ed25519 para assinaturas; domain separation em todas as assinaturas.
	•	Chaves: gere e rote chaves regularmente; armazene em HSM/secret manager.
	•	Fail-fast: em produção, não subir sem API_KEY e materiais de chave válidos.
	•	SBOM/Análise: gere CycloneDX e rode OSV-Scanner no CI.
	•	Política de reporte: consulte SECURITY.md.

⸻

🗺️ Roadmap
	•	Benchmarks e testes de carga (append/verify streaming).
	•	Exemplos de observabilidade com métricas e logs estruturados.
	•	Políticas adicionais (quota por tenant, circuit-breaker com backoff).
	•	Integrações “one-click” com LLMs (mensagem ⇄ span).
	•	Atestações (SLSA) nas imagens e pacotes.

⸻

❓ FAQ

Q: Isso substitui meu banco?
A: Não. Ele provê rastro verificável e linguagem de integração/automação. Guarde seus dados onde quiser e use o ledger como fonte de verdade auditável.

Q: Posso usar só com Node ou só com Deno?
A: Sim. O projeto é portável — escolha o runtime que preferir.

Q: Como rodo com Docker?
A:
	•	Node: docker build -t {DOCKER_IMAGE} -f Dockerfile . && docker run --rm -p 8000:8000 {DOCKER_IMAGE}
	•	Deno: docker build -t {DOCKER_IMAGE}-deno -f Dockerfile.deno . && docker run --rm -p 8000:8000 {DOCKER_IMAGE}-deno

Q: Como garanto que ninguém alterou meu ledger?
A: O verificador reconstrói a hash chain e valida assinaturas Ed25519. Qualquer alteração quebra a cadeia e é detectada.

⸻

🤝 Contribuição
	1.	pnpm i && pnpm build
	2.	pnpm lint && pnpm test (thresholds habilitados)
	3.	Abra PR com descrição clara, casos de teste e sem segredos.
	4.	Use CODEOWNERS e o template de PR.
	5.	Para vulnerabilidades, não abra issue pública — use o canal de SECURITY.md.

⸻

📄 Licença

MIT — veja LICENSE.

⸻

EN (short pitch)

JSON✯Atomic is a lightweight, versatile backend that speaks a universal language (canonical JSON) and is AI-native. In minutes, you create spans, sign, verify, and run policies with an append-only ledger and end-to-end cryptographic proofs.

⸻

Placeholders a preencher: {REPO_URL}, {NPM_NAME}, {DOCKER_IMAGE}.
Lembrete: mantenha banido qualquer nome anterior; use sempre JSON✯Atomic e a narrativa “backend leve, língua universal, AI-native”.
