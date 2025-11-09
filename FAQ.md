# FAQ - Perguntas Frequentes

Respostas para as perguntas mais comuns sobre JSON✯Atomic.

---

## 🎯 Conceitos Gerais

### 1. O que é JSON✯Atomic?

JSON✯Atomic é um backend leve e versátil que fala uma língua universal (JSON canônico) e é AI-native. Oferece trilha auditável e provas criptográficas de ponta a ponta para eventos e spans.

### 2. JSON✯Atomic substitui meu banco de dados?

**Não.** JSON✯Atomic complementa seu banco de dados fornecendo:
- Trilha auditável de eventos
- Provas criptográficas de integridade
- Linguagem universal de integração
- Rastreamento de operações

Use-o junto com seu banco de dados tradicional.

### 3. Para que serve JSON✯Atomic?

Principais casos de uso:
- **Event Sourcing**: Store de eventos imutável
- **Auditoria**: Trilha completa de operações
- **Integração**: Linguagem comum entre sistemas
- **AI/LLM**: Rastreamento de interações com modelos
- **Observabilidade**: Distributed tracing com provas

### 4. Qual a diferença entre JSON✯Atomic e outros sistemas de logging?

| Feature | JSON✯Atomic | Logs Tradicionais |
|---------|--------------|-------------------|
| Assinaturas digitais | ✅ | ❌ |
| Hash chain | ✅ | ❌ |
| Verificação de integridade | ✅ | ❌ |
| AI-native | ✅ | ❌ |
| Append-only garantido | ✅ | ⚠️ |
| Formato estruturado | ✅ | ⚠️ |

### 5. É open source?

**Sim!** Licença MIT — use livremente em projetos pessoais e comerciais.

---

## 🚀 Começando

### 6. Preciso saber criptografia para usar?

**Não!** A API é simples:

```typescript
const span = createSpan({ type: 'user.created', body: {...} })
const signed = await signSpan(span, { domain, privateKey })
const valid = await verifySpan(signed, { domain, publicKey })
```

A criptografia é abstraída para você.

### 7. Qual o quickstart mais rápido?

```bash
# 1. Clone e instale
git clone https://github.com/danvoulez/JsonAtomic.git
cd JsonAtomic && npm install

# 2. Gere chaves
node scripts/generate-keys.js

# 3. Configure .env
echo "PRIVATE_KEY=..." > .env
echo "PUBLIC_KEY=..." >> .env

# 4. Execute exemplo
ts-node examples/node/01-sign-verify.ts
```

Pronto em ~5 minutos!

### 8. Posso usar apenas Node ou apenas Deno?

**Ambos!** JSON✯Atomic é portável:
- **Node.js 18+**: Totalmente suportado
- **Deno 1.45+**: Totalmente suportado

Escolha o runtime que preferir.

### 9. Preciso de Docker?

**Não.** Docker é opcional — útil para:
- Deployment em produção
- Testes de integração
- Ambientes isolados

Mas você pode rodar nativamente com Node/Deno.

### 10. Onde estão os exemplos práticos?

Em `examples/`:
- `01-sign-verify.ts`: Básico de assinaturas
- `02-ledger-ndjson.ts`: Ledger append-only
- `03-ttl-policy.ts`: Políticas de TTL
- `04-metrics.ts`: Observabilidade
- `05-llm-integration.ts`: Integração com AI

---

## 🔐 Segurança

### 11. Por que Ed25519 e BLAKE3?

**Ed25519**:
- ✅ Rápido (muito mais que RSA)
- ✅ Assinaturas pequenas (64 bytes)
- ✅ Resistente a timing attacks
- ✅ Amplamente usado (SSH, Git, etc.)

**BLAKE3**:
- ✅ Ultra-rápido (mais que SHA-256)
- ✅ Paralelizável
- ✅ Seguro e moderno
- ✅ Determinístico

### 12. Como proteger minhas chaves privadas?

**Desenvolvimento**:
```bash
# .env (adicionar ao .gitignore)
PRIVATE_KEY=hex:...
```

**Produção**:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- HSM (alta segurança)

**Nunca**:
- ❌ Hardcode no código
- ❌ Commite no Git
- ❌ Compartilhe em Slack/Discord

### 13. Com que frequência devo rotacionar chaves?

**Recomendação**: 90 dias

JSON✯Atomic suporta múltiplas chaves públicas simultaneamente, permitindo rotação sem downtime:

```typescript
const publicKeys = [
  currentKey,   // Chave atual
  previousKey   // Aceita durante transição
]
```

### 14. O que é domain separation?

Técnica de segurança que previne cross-protocol attacks:

```typescript
// Ao invés de assinar apenas o hash
const sig = sign(hash, privateKey)

// Assinamos hash + contexto
const message = `json-atomic:v1:${domain}:${hash}`
const sig = sign(message, privateKey)
```

Garante que assinatura de um contexto não seja válida em outro.

### 15. Como detectar adulteração do ledger?

Duas camadas de proteção:

1. **Assinaturas**: Cada span é assinado
2. **Hash chain**: Cada span referencia hash do anterior

```typescript
const result = await verifyLedgerFile('ledger.ndjson', { publicKeys })

if (!result.ok) {
  console.error('Ledger adulterado!')
  console.error(result.errors)
}
```

Qualquer modificação quebra a cadeia.

---

## 🏗️ Arquitetura

### 16. Por que NDJSON ao invés de JSON normal?

**NDJSON** (Newline Delimited JSON):

✅ **Streaming**: Processa gigabytes sem carregar em memória  
✅ **Append-only**: Adicione facilmente com `>>` ou `appendFileSync`  
✅ **Ferramentas Unix**: `cat`, `grep`, `jq` funcionam nativamente  
✅ **Portável**: Funciona em qualquer sistema  
✅ **Simples**: Um span por linha  

```ndjson
{"id":"1","type":"user.created",...}
{"id":"2","type":"payment.processed",...}
{"id":"3","type":"email.sent",...}
```

### 17. Posso usar um banco de dados SQL?

**Sim!** JSON✯Atomic é flexível:

```sql
-- PostgreSQL
CREATE TABLE spans (
  id UUID PRIMARY KEY,
  type TEXT,
  body JSONB,
  signature JSONB,
  created_at TIMESTAMPTZ
);

-- Inserir spans
INSERT INTO spans VALUES (...);

-- Query por tipo
SELECT * FROM spans WHERE type = 'payment.processed';
```

NDJSON é o formato canônico, mas você pode exportar para qualquer formato.

### 18. Como funciona a hash chain?

Cada span referencia o hash do span anterior:

```
Span 1 → Hash: H1
Span 2 → previousHash: H1, Hash: H2
Span 3 → previousHash: H2, Hash: H3
```

Se alguém modificar Span 2:
- Hash muda para H2'
- Span 3 ainda referencia H2 (original)
- **Chain quebrada!** ❌

### 19. Políticas são obrigatórias?

**Não.** São opcionais, mas recomendadas:

- **TTL**: Previne replay attacks
- **Throttle**: Limita taxa de eventos
- **Retry**: Resiliência automática
- **Circuit Breaker**: Previne cascata de falhas

Use conforme necessidade.

### 20. Qual o tamanho máximo de um span?

**Tecnicamente**: Ilimitado (JSON suporta).

**Recomendação**: < 1 MB

Se precisar de payloads grandes:
- Armazene dados em S3/blob storage
- Coloque referência no span:

```typescript
{
  type: 'file.uploaded',
  body: {
    fileId: 'file-123',
    url: 's3://bucket/file.pdf',
    size: 10485760,
    hash: 'blake3:...'
  }
}
```

---

## 🧪 Desenvolvimento

### 21. Como rodar testes?

```bash
# Todos os testes
npm test

# Com coverage
npm run test:coverage

# Watch mode (TDD)
npm run test:watch

# Deno
deno test --allow-all tests/
```

### 22. Como adicionar uma nova política?

1. Defina a interface:

```typescript
interface MyPolicy {
  type: 'my-policy'
  maxValue: number
}
```

2. Implemente a lógica:

```typescript
function applyMyPolicy(span: Span, policy: MyPolicy) {
  if (span.body.value > policy.maxValue) {
    return { decision: 'deny', reason: 'Value too high' }
  }
  return { decision: 'allow' }
}
```

3. Adicione testes e documentação.

### 23. Como contribuir?

Veja [CONTRIBUTING.md](CONTRIBUTING.md)!

Resumo:
1. Fork o repo
2. Crie branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'feat: add new feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra Pull Request

### 24. Posso usar em produção?

**Sim!** Versão 1.1.0 passou por:
- ✅ Hardening de segurança
- ✅ Testes abrangentes (135+ testes)
- ✅ CodeQL security scanning
- ✅ Audit de dependências
- ✅ Documentação completa

Veja checklist em [OPERATIONS.md](OPERATIONS.md).

### 25. Onde reportar bugs?

**Bugs gerais**: [GitHub Issues](https://github.com/danvoulez/JsonAtomic/issues)

**Vulnerabilidades de segurança**: [SECURITY.md](SECURITY.md) (privado!)

Sempre inclua:
- Versão do JSON✯Atomic
- Runtime (Node/Deno) e versão
- OS
- Steps to reproduce
- Logs/screenshots

---

## 🤝 Comunidade

### 26. Onde tirar dúvidas?

- **GitHub Discussions**: Perguntas gerais
- **Issues**: Bugs e feature requests
- **Docs**: Veja `docs/` para guias detalhados

### 27. Tem Slack/Discord?

Ainda não. Por enquanto:
- **GitHub Discussions** para conversas
- **Issues** para tracking

Se a comunidade crescer, consideraremos!

### 28. Posso usar comercialmente?

**Sim!** Licença MIT permite uso comercial sem restrições.

Apenas mantenha o aviso de copyright.

### 29. Há suporte profissional?

Atualmente não há suporte pago oficial.

Para consultorias ou features custom, entre em contato via Issues/Discussions.

### 30. Como posso ajudar?

Várias formas:
- ⭐ Star no GitHub
- 📝 Melhorar documentação
- 🐛 Reportar bugs
- 💡 Sugerir features
- 🧪 Adicionar testes
- 🌍 Traduzir docs
- 📢 Divulgar o projeto
- 💻 Contribuir código

Toda ajuda é bem-vinda! 🙏

---

## 📚 Recursos

- **Documentação**: [docs/](docs/)
- **Exemplos**: [examples/](examples/)
- **Contribuir**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Segurança**: [SECURITY.md](SECURITY.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Glossário**: [GLOSSARY.md](GLOSSARY.md)

---

**Não encontrou sua pergunta?**

Abra uma [Discussion](https://github.com/danvoulez/JsonAtomic/discussions) ou [Issue](https://github.com/danvoulez/JsonAtomic/issues)!

**JSON✯Atomic** — A língua universal para seus sistemas e LLMs. 🚀
