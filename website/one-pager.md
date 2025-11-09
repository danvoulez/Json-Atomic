# JSON✯Atomic — O backend leve que fala a língua universal

> **O backend leve e versátil que fala uma língua universal — perfeita para apps, integrações e LLMs — com trilha auditável e provas criptográficas de ponta a ponta.**

---

## 🌟 Em Minutos, Não Meses

JSON✯Atomic padroniza eventos, prova integridade e simplifica políticas.

**Sem mágica. JSON puro, prova criptográfica e DX que não te enrola.**

---

## ✨ Por Que JSON✯Atomic?

### 🌍 Universal
Protocolo e dados em JSON canônico — funcionam em qualquer stack, qualquer linguagem, qualquer sistema.

### 🤖 AI-Native
Pensado para LLMs desde o dia 1. Semântica clara, mensagens estruturadas, pronto para prompts.

### ✅ Verificável
Cada evento é assinado (Ed25519) e hashado (BLAKE3). Qualquer adulteração é detectada.

### 📝 Auditável
Ledger append-only em NDJSON. Toda mudança deixa rastro permanente e comprovável.

### 🔒 Seguro
Criptografia moderna (BLAKE3 + Ed25519), domain separation, fail-fast, políticas computáveis.

### 🚀 Portátil
Roda em Node.js ou Deno. Containers simples. Zero vendor lock-in.

---

## 🎯 Casos de Uso

### Governança & Compliance
Registro imutável de decisões críticas com assinaturas verificáveis. Perfeito para finance, healthcare, legal.

### Event Sourcing
Store de eventos com garantia de ordem e integridade criptográfica. State management confiável.

### Integração Multi-Sistema
Linguagem comum entre microsserviços, APIs legadas e sistemas modernos. Fim do caos de formatos.

### AI/LLM Integration
Rastreamento verificável de prompts, respostas e decisões de modelos. Compliance e debugging facilitados.

### Observabilidade Avançada
Distributed tracing com provas criptográficas. Logs que ninguém pode adulterar.

---

## 💡 Comece em 5 Minutos

```bash
# 1. Clone e instale
git clone https://github.com/danvoulez/JsonAtomic.git
cd JsonAtomic && npm install && npm run build

# 2. Configure chaves
node scripts/generate-keys.js
# Salve em .env (PRIVATE_KEY e PUBLIC_KEY)

# 3. Primeiro span
```

```typescript
import { createSpan, signSpan, verifySpan } from 'json-atomic'

// Criar evento
const span = createSpan({
  type: 'user.created',
  body: { userId: 'u_123', plan: 'pro' }
})

// Assinar
const signed = await signSpan(span, { 
  domain: 'meu-app', 
  privateKey 
})

// Verificar
const valid = await verifySpan(signed, { 
  domain: 'meu-app', 
  publicKey 
})

console.log('Válido?', valid) // true ✅
```

**Pronto!** Seu primeiro evento assinado e verificado.

---

## 🔥 Diferenciais

| Feature | JSON✯Atomic | Logs Tradicionais |
|---------|--------------|-------------------|
| 🔐 Assinaturas digitais | ✅ | ❌ |
| 🔗 Hash chain | ✅ | ❌ |
| ✅ Verificação de integridade | ✅ | ❌ |
| 🤖 AI-native | ✅ | ❌ |
| 📝 Append-only garantido | ✅ | ⚠️ |
| 🌍 Formato universal | ✅ JSON | ⚠️ Variado |
| 🚀 Zero vendor lock-in | ✅ | ❌ |
| 🔓 Open Source (MIT) | ✅ | ⚠️ Variado |

---

## 🧩 Arquitetura Simples

```
┌─────────────────────────────────────────────┐
│         Apps / Services / LLMs              │
│  (Node, Deno, Python, Browser, etc.)       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │   JSON✯Atomic Core         │
    │  • Create & Sign Spans     │
    │  • Verify Integrity        │
    │  • Apply Policies          │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │   Ledger (NDJSON)          │
    │  • Append-only             │
    │  • Hash chain              │
    │  • Cryptographic proofs    │
    └────────────────────────────┘
```

**Simples. Poderoso. Verificável.**

---

## 🎁 O Que Você Ganha

### Para Desenvolvedores
- ✅ API limpa e intuitiva
- ✅ Quickstart em 5 minutos
- ✅ Exemplos copy-paste
- ✅ TypeScript first-class
- ✅ Documentação honesta
- ✅ Zero surpresas

### Para Arquitetos
- ✅ Portabilidade total (Node/Deno/Docker)
- ✅ Escalabilidade horizontal
- ✅ Observabilidade built-in
- ✅ Políticas computáveis
- ✅ Zero vendor lock-in
- ✅ Integração fácil

### Para CTOs
- ✅ Compliance facilitado (SOC2, GDPR, HIPAA)
- ✅ Auditoria automática
- ✅ Segurança criptográfica
- ✅ Custo previsível
- ✅ Open source (MIT)
- ✅ Production-ready

---

## 📊 Números que Importam

- **1.1.0**: Versão atual (production-ready)
- **135+**: Testes automatizados
- **80%+**: Code coverage
- **0**: Vulnerabilidades conhecidas (CodeQL + OSV)
- **5 min**: Tempo para primeiro span
- **< 1ms**: Latência de assinatura
- **∞**: Escalabilidade (append-only, stateless)

---

## 🚀 Exemplos Rápidos

### Event Sourcing
```typescript
// Cada mudança vira evento imutável
const events = [
  createSpan({ type: 'cart.created', body: { cartId } }),
  createSpan({ type: 'item.added', body: { productId, qty: 2 } }),
  createSpan({ type: 'checkout.completed', body: { total: 99.99 } })
]

// Assinar e salvar no ledger
for (const event of events) {
  const signed = await signSpan(event, { domain, privateKey })
  appendToLedger(signed)
}
```

### Auditoria
```typescript
// Verificar integridade do ledger
const result = await verifyLedgerFile('ledger.ndjson', { 
  publicKeys 
})

if (!result.ok) {
  alert('LEDGER COMPROMETIDO!')
}
```

### AI Integration
```typescript
// Rastrear interação com LLM
const promptSpan = createSpan({
  type: 'llm.prompt',
  body: { prompt: 'Explique quantum computing', model: 'gpt-4' }
})

const signed = await signSpan(promptSpan, { domain, privateKey })
// Agora você tem prova verificável do prompt enviado!
```

---

## 🌍 Ecossistema

### Runtimes Suportados
- ✅ Node.js 18+
- ✅ Deno 1.45+
- 🔄 Bun (roadmap)

### Integrações
- ✅ REST API
- ✅ Prometheus metrics
- ✅ Structured logs (Pino)
- 🔄 PostgreSQL (docs disponíveis)
- 🔄 ClickHouse (docs disponíveis)
- 🔄 OpenAPI/Swagger

### Ferramentas
- ✅ CLI (Deno)
- ✅ Playground UI
- 🔄 SDK JavaScript/TypeScript
- 🔄 Python client
- 🔄 Go client

---

## 📚 Documentação de Primeira

Não vendemos fumaça. Nossa documentação é:

- ✅ **Honesta**: Não prometemos o que não entregamos
- ✅ **Completa**: Overview, Getting Started, Architecture, Security, API
- ✅ **Prática**: 5+ exemplos funcionais (Node e Deno)
- ✅ **Didática**: FAQ com 30 perguntas, Glossário completo
- ✅ **Atualizada**: Versão 1.1.0, Novembro 2024

**Explore**:
- [📖 Overview](../docs/overview.md)
- [🚀 Getting Started](../docs/getting-started.md)
- [🏗️ Architecture](../docs/architecture.md)
- [🔒 Security](../docs/security.md)
- [📝 API Reference](../docs/api/openapi.md)
- [❓ FAQ](../FAQ.md)
- [📚 Glossary](../GLOSSARY.md)

---

## 🤝 Comunidade Open Source

### Licença: MIT
Use livremente. Comercial ou pessoal. Sem pegadinhas.

### Contribua
- 🐛 Reporte bugs
- 💡 Sugira features
- 📝 Melhore docs
- 💻 Contribua código

[Guia de Contribuição](../CONTRIBUTING.md) | [Code of Conduct](../CODE_OF_CONDUCT.md)

### Segurança
Vulnerabilidades? Reporte em privado: [SECURITY.md](../SECURITY.md)

---

## 🎯 Próximos Passos

### 1. Explore
```bash
git clone https://github.com/danvoulez/JsonAtomic.git
```

### 2. Aprenda
Leia [Getting Started](../docs/getting-started.md) (10 min)

### 3. Experimente
Execute [exemplos práticos](../examples/README.md)

### 4. Integre
Adicione ao seu projeto

### 5. Contribua
Ajude a melhorar! 🙏

---

## 💬 Perguntas Rápidas

**P: É grátis?**  
R: Sim! Open source, licença MIT.

**P: Funciona em produção?**  
R: Sim! Versão 1.1.0 passou por hardening completo.

**P: Substitui meu banco?**  
R: Não. Complementa com trilha auditável e verificável.

**P: Difícil de aprender?**  
R: Não! API simples, quickstart em 5 minutos.

**P: E se eu encontrar um bug?**  
R: Abra uma [issue](https://github.com/danvoulez/JsonAtomic/issues) ou [PR](https://github.com/danvoulez/JsonAtomic/pulls)!

[Mais perguntas? FAQ completo →](../FAQ.md)

---

## 📢 Divulgue

Se JSON✯Atomic te ajudou, considere:

- ⭐ Star no [GitHub](https://github.com/danvoulez/JsonAtomic)
- 🐦 Tweet sobre o projeto
- 📝 Escreva um post
- 💬 Conte para colegas

**Toda ajuda conta!** 🙏

---

## 📞 Contato

- **GitHub**: [danvoulez/JsonAtomic](https://github.com/danvoulez/JsonAtomic)
- **Issues**: [Bugs e Features](https://github.com/danvoulez/JsonAtomic/issues)
- **Discussions**: [Perguntas gerais](https://github.com/danvoulez/JsonAtomic/discussions)
- **Security**: security@jsonatomic.dev

---

## 🏁 Comece Agora

```bash
git clone https://github.com/danvoulez/JsonAtomic.git
cd JsonAtomic
npm install && npm run build
node scripts/generate-keys.js
ts-node examples/node/01-sign-verify.ts
```

**5 minutos. Sem complicação. Funcionando.**

---

<div align="center">

## JSON✯Atomic

**O backend leve que fala a língua universal**  
**dos seus sistemas e dos seus LLMs.**

[📖 Docs](../docs/) · [🚀 Quickstart](../docs/getting-started.md) · [💻 GitHub](https://github.com/danvoulez/JsonAtomic) · [❓ FAQ](../FAQ.md)

---

**Licença MIT** · **Production-Ready** · **Open Source**

Feito com ❤️ pela comunidade

</div>
