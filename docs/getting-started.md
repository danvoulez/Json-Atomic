# Getting Started com JSON✯Atomic

Este guia mostra como instalar, configurar e executar seu primeiro fluxo completo com JSON✯Atomic em menos de 10 minutos.

---

## 📋 Pré-requisitos

- **Node.js 18+** ou **Deno 1.45+**
- **Git** (para clonar o repositório)
- **make** (opcional, para comandos de conveniência)

---

## 🚀 Instalação

### Clonar o Repositório

```bash
git clone https://github.com/danvoulez/JsonAtomic.git
cd JsonAtomic
```

### Opção 1: Node.js

```bash
# Instalar dependências
npm install

# ou com pnpm (recomendado)
pnpm install

# Build
npm run build
```

### Opção 2: Deno

```bash
# Nenhuma instalação necessária!
# Deno baixa dependências automaticamente
```

---

## 🔑 Gerar Chaves Ed25519

As chaves são essenciais para assinar e verificar spans. **NUNCA** commite chaves privadas no Git.

### Usando OpenSSL (Linux/macOS)

```bash
# Gerar par de chaves
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem

# Converter para formato hex (opcional)
openssl pkey -in private.pem -text -noout | grep priv: -A3 | tail -n 3 | tr -d ':\n '
openssl pkey -in public.pem -pubin -text -noout | grep pub: -A3 | tail -n 3 | tr -d ':\n '
```

### Usando o Script Incluído (Node)

```bash
node scripts/generate-keys.js

# Output:
# Private Key (hex): abc123...
# Public Key (hex): def456...
```

### Armazenar com Segurança

```bash
# Criar arquivo .env (NÃO commitar!)
cat > .env << EOF
PRIVATE_KEY=sua_chave_privada_hex
PUBLIC_KEY=sua_chave_publica_hex
EOF

# Adicionar ao .gitignore
echo ".env" >> .gitignore
```

---

## 🎯 Primeiro Fluxo: Criar → Assinar → Verificar

### Node.js + TypeScript

Crie `hello-atomic.ts`:

```typescript
import { createSpan, signSpan, verifySpan } from './index'
import * as dotenv from 'dotenv'

dotenv.config()

const domain = 'demo-json-atomic'

// Carregar chaves do ambiente
const privateKey = process.env.PRIVATE_KEY!
const publicKey = process.env.PUBLIC_KEY!

async function main() {
  // 1. Criar span
  const span = createSpan({
    type: 'user.signup',
    body: {
      userId: 'u_12345',
      email: 'usuario@exemplo.com',
      plan: 'pro'
    },
    meta: {
      traceId: 'trace-' + Date.now(),
      source: 'web-app'
    }
  })
  
  console.log('✅ Span criado:', span.id)
  
  // 2. Assinar span
  const signed = await signSpan(span, { domain, privateKey })
  console.log('✅ Span assinado:', signed.signature.sig.substring(0, 16) + '...')
  
  // 3. Verificar assinatura
  const valid = await verifySpan(signed, { domain, publicKey })
  console.log('✅ Assinatura válida:', valid)
  
  if (!valid) {
    console.error('❌ Assinatura inválida!')
    process.exit(1)
  }
  
  console.log('\n🎉 Sucesso! Seu primeiro span foi criado, assinado e verificado.')
}

main().catch(console.error)
```

Executar:

```bash
# Instalar dotenv
npm install dotenv

# Executar
ts-node hello-atomic.ts
# ou
node --loader ts-node/esm hello-atomic.ts
```

### Deno

Crie `hello-atomic.ts`:

```typescript
import { createSpan, signSpan, verifySpan } from './index.ts'
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts"

const env = await load()

const domain = 'demo-json-atomic'
const privateKey = env.PRIVATE_KEY!
const publicKey = env.PUBLIC_KEY!

// Criar span
const span = createSpan({
  type: 'user.signup',
  body: {
    userId: 'u_12345',
    email: 'usuario@exemplo.com',
    plan: 'pro'
  },
  meta: {
    traceId: 'trace-' + Date.now()
  }
})

console.log('✅ Span criado:', span.id)

// Assinar
const signed = await signSpan(span, { domain, privateKey })
console.log('✅ Span assinado')

// Verificar
const valid = await verifySpan(signed, { domain, publicKey })
console.log('✅ Assinatura válida:', valid)

if (!valid) {
  console.error('❌ Assinatura inválida!')
  Deno.exit(1)
}

console.log('\n🎉 Sucesso!')
```

Executar:

```bash
deno run --allow-read --allow-env hello-atomic.ts
```

---

## 📝 Segundo Fluxo: Salvar no Ledger NDJSON

```typescript
import { createSpan, signSpan } from './index'
import { writeFileSync, appendFileSync } from 'node:fs'

const domain = 'demo'
const privateKey = process.env.PRIVATE_KEY!

// Criar e assinar múltiplos spans
const events = [
  { type: 'user.created', body: { id: 'u1' } },
  { type: 'payment.processed', body: { id: 'pay1', amount: 99.99 } },
  { type: 'email.sent', body: { to: 'user@example.com' } }
]

async function appendToLedger() {
  for (const event of events) {
    const span = createSpan(event)
    const signed = await signSpan(span, { domain, privateKey })
    
    // Converter para NDJSON (uma linha por span)
    const line = JSON.stringify(signed) + '\n'
    
    // Append ao arquivo
    appendFileSync('ledger.ndjson', line)
    console.log('✅ Span salvo no ledger:', span.id)
  }
}

appendToLedger()
```

Verificar o ledger:

```bash
# Ver conteúdo
cat ledger.ndjson | jq .

# Contar spans
wc -l ledger.ndjson
```

---

## ✅ Terceiro Fluxo: Verificar Ledger Completo

```typescript
import { verifyLedgerFile } from './index'

const result = await verifyLedgerFile('ledger.ndjson', {
  domain: 'demo',
  publicKeys: [process.env.PUBLIC_KEY!]
})

console.log('Verificação do Ledger:')
console.log('- Total de spans:', result.summary.total)
console.log('- Válidos:', result.summary.valid)
console.log('- Inválidos:', result.summary.invalid)
console.log('- Hash chain OK:', result.summary.hashChain)

if (!result.ok) {
  console.error('❌ Ledger possui problemas!')
  console.error('Detalhes:', result.errors)
  process.exit(1)
}

console.log('✅ Ledger íntegro!')
```

---

## 🐳 Executar com Docker

### Build da Imagem

```bash
# Node.js
docker build -t json-atomic:latest .

# Deno
docker build -t json-atomic-deno:latest -f Dockerfile.deno .
```

### Executar

```bash
# Node.js
docker run --rm \
  -e PRIVATE_KEY=$PRIVATE_KEY \
  -e PUBLIC_KEY=$PUBLIC_KEY \
  -p 8000:8000 \
  json-atomic:latest

# Deno
docker run --rm \
  -e PRIVATE_KEY=$PRIVATE_KEY \
  -e PUBLIC_KEY=$PUBLIC_KEY \
  -p 8000:8000 \
  json-atomic-deno:latest
```

### Docker Compose

```bash
# Iniciar todos os serviços
docker-compose up

# Parar
docker-compose down
```

---

## 🧪 Executar Testes

```bash
# Node.js
npm test

# Com coverage
npm run test:coverage

# Deno
deno test --allow-all tests/
```

---

## 📊 API REST (Opcional)

Se quiser expor uma API HTTP:

### Node.js

```bash
# Iniciar servidor
npm run start

# Testar
curl -X POST http://localhost:8000/spans \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test.event",
    "body": { "message": "hello" }
  }'
```

### Deno

```bash
# Iniciar servidor
deno run --allow-net --allow-env --allow-read api/restApi.ts

# Testar
curl http://localhost:8000/health
```

---

## 🔍 Próximos Passos

1. **Explore exemplos**: Veja [../examples/](../examples/) para casos de uso mais complexos
2. **Entenda a arquitetura**: Leia [architecture.md](./architecture.md)
3. **Configure políticas**: Aprenda sobre TTL, throttling e retry
4. **Integre com LLMs**: Veja exemplos de integração com modelos de linguagem
5. **Deploy em produção**: Consulte [OPERATIONS.md](../OPERATIONS.md)

---

## ⚠️ Checklist de Segurança

Antes de ir para produção:

- [ ] Chaves privadas armazenadas em secret manager (não em `.env`)
- [ ] Rotação de chaves configurada
- [ ] Validação de entrada habilitada
- [ ] Logs estruturados configurados
- [ ] Métricas e alertas ativos
- [ ] Backups do ledger configurados
- [ ] Testes de integridade passando
- [ ] SBOM gerado e scanners rodando no CI

---

## 🆘 Problemas Comuns

### "Cannot find module './index'"

Certifique-se de ter executado o build:
```bash
npm run build
```

### "PRIVATE_KEY is undefined"

Configure suas variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas chaves
```

### Assinatura sempre inválida

Verifique se está usando o mesmo `domain` para assinar e verificar:
```typescript
// Deve ser idêntico
const domain = 'meu-app'
await signSpan(span, { domain, privateKey })
await verifySpan(span, { domain, publicKey })
```

---

## 📚 Recursos Adicionais

- [Documentação Completa](./overview.md)
- [Arquitetura](./architecture.md)
- [Segurança](./security.md)
- [API Reference](./api/openapi.md)
- [FAQ](../FAQ.md)
- [Glossário](../GLOSSARY.md)

---

**Pronto para começar!** 🚀

Em caso de dúvidas, abra uma issue no [repositório](https://github.com/danvoulez/JsonAtomic).
