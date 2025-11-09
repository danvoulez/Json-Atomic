# Segurança JSON✯Atomic

Este documento descreve o modelo de segurança, ameaças, mitigações e melhores práticas para JSON✯Atomic.

---

## 🎯 Princípios de Segurança

### 1. Defense in Depth
Múltiplas camadas de proteção. Se uma falhar, outras ainda protegem.

### 2. Fail-Fast
Falhar cedo e de forma evidente quando algo está errado. Não permitir estados inválidos.

### 3. Least Privilege
Componentes e usuários têm apenas as permissões mínimas necessárias.

### 4. Cryptographic Integrity
Toda operação crítica é protegida por criptografia (hash + assinatura).

### 5. Audit Everything
Tudo deixa rastro verificável. Imutabilidade por design.

---

## 🔐 Modelo Criptográfico

### Algoritmos Escolhidos

#### BLAKE3 (Hashing)
- **Por quê?** Ultra-rápido, paralelizável, seguro
- **Uso**: Hash de spans, hash chains, checksums
- **Tamanho**: 256 bits (32 bytes)
- **Biblioteca**: `@noble/hashes`

#### Ed25519 (Assinatura Digital)
- **Por quê?** Rápido, assinaturas pequenas, resistente a timing attacks
- **Uso**: Assinar spans, verificar integridade
- **Chave privada**: 32 bytes
- **Chave pública**: 32 bytes
- **Assinatura**: 64 bytes
- **Biblioteca**: `@noble/curves`

### Domain Separation

**Crítico**: Sempre incluir contexto na mensagem antes de assinar.

```typescript
// ❌ Vulnerável a cross-protocol attacks
const signature = ed25519.sign(hash, privateKey)

// ✅ Seguro com domain separation
const message = `json-atomic:v1.1.0:${domain}:${hash}`
const signature = ed25519.sign(message, privateKey)
```

**Por que?** Previne que assinatura de um contexto seja reutilizada em outro.

---

## 🔑 Gerenciamento de Chaves

### Geração de Chaves

```bash
# Produção: Use ferramentas dedicadas
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem

# ou HSM/KMS
aws kms create-key --key-spec ECC_NIST_P256
```

### Armazenamento

#### ❌ Nunca faça isso
```typescript
// NUNCA hardcode chaves no código
const privateKey = '0x123abc...'

// NUNCA commite no Git
git add .env
```

#### ✅ Faça isso

**Desenvolvimento**:
```bash
# .env (adicionar ao .gitignore!)
PRIVATE_KEY=hex:abc123...
PUBLIC_KEY=hex:def456...
```

**Produção**:
```typescript
// Secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)
const privateKey = await secretManager.getSecret('json-atomic/signing-key')

// Variável de ambiente (injetada pelo orchestrator)
const privateKey = process.env.SIGNING_KEY

// Fail-fast se ausente
if (!privateKey) {
  throw new Error('SIGNING_KEY not configured - cannot start')
}
```

### Rotação de Chaves

**Frequência recomendada**: 90 dias (ou conforme política da empresa)

**Processo**:
1. Gerar novo par de chaves
2. Adicionar chave pública nova à lista de chaves aceitas
3. Começar a assinar com chave nova
4. Manter chave antiga para verificação por período de transição (ex: 30 dias)
5. Remover chave antiga da lista

```typescript
// Suporte a múltiplas chaves públicas
const publicKeys = [
  process.env.PUBLIC_KEY_CURRENT,   // Chave atual
  process.env.PUBLIC_KEY_PREVIOUS,  // Chave em rotação
]

// Verificação aceita qualquer chave válida
async function verifySpan(span: SignedSpan) {
  for (const pubKey of publicKeys) {
    const valid = await ed25519.verify(
      span.signature.sig,
      message,
      pubKey
    )
    if (valid) return true
  }
  return false
}
```

### Proteção de Chaves

- **Desenvolvimento**: `.env` no `.gitignore`
- **CI/CD**: Secrets do GitHub/GitLab
- **Produção**: AWS Secrets Manager, Vault, Azure Key Vault
- **Alta segurança**: HSM (Hardware Security Module)

---

## 🛡️ Ameaças e Mitigações

### 1. Falsificação de Spans

**Ameaça**: Atacante tenta criar spans falsos sem chave privada.

**Mitigação**:
- ✅ Assinatura Ed25519 obrigatória
- ✅ Verificação em toda operação crítica
- ✅ Rejeição de spans não assinados

```typescript
if (!span.signature) {
  throw new Error('Unsigned span rejected')
}

const valid = await verifySpan(span, { domain, publicKey })
if (!valid) {
  throw new Error('Invalid signature - span rejected')
}
```

### 2. Replay Attacks

**Ameaça**: Atacante captura span válido e reenvia múltiplas vezes.

**Mitigações**:
- ✅ Timestamps obrigatórios
- ✅ Política de TTL
- ✅ Nonces/IDs únicos (UUIDs)
- ✅ Hash chain (detecta duplicatas e ordem)

```typescript
// TTL: Rejeitar spans muito antigos
const age = Date.now() - span.meta.timestamp
if (age > MAX_AGE_MS) {
  throw new Error('Span too old - possible replay attack')
}

// Deduplicação por ID
if (seenSpanIds.has(span.id)) {
  throw new Error('Duplicate span ID - possible replay attack')
}
seenSpanIds.add(span.id)
```

### 3. Adulteração do Ledger

**Ameaça**: Atacante modifica ledger NDJSON no disco.

**Mitigações**:
- ✅ Hash chain (qualquer modificação quebra a cadeia)
- ✅ Assinaturas por span
- ✅ Verificação periódica
- ✅ Backups imutáveis

```typescript
// Verificação detecta adulteração
const result = await verifyLedger('ledger.ndjson', publicKeys)
if (!result.ok) {
  alert('LEDGER COMPROMISED - Hash chain broken!')
}
```

### 4. Man-in-the-Middle

**Ameaça**: Atacante intercepta comunicação e modifica dados em trânsito.

**Mitigações**:
- ✅ TLS obrigatório em produção
- ✅ Assinaturas end-to-end (detectam modificação)
- ✅ Certificate pinning (opcional)

```typescript
// API server: TLS obrigatório
const server = https.createServer({
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem')
}, app)

// Cliente: Verificar certificado
const agent = new https.Agent({
  ca: fs.readFileSync('ca-cert.pem')
})
```

### 5. Denial of Service (DoS)

**Ameaça**: Atacante sobrecarrega sistema com requisições.

**Mitigações**:
- ✅ Rate limiting por IP/tenant
- ✅ Throttling policies
- ✅ Circuit breakers
- ✅ Quotas e limites

```typescript
// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minuto
  max: 100,                 // 100 requests/min
  message: 'Too many requests'
})

app.use('/api', limiter)
```

### 6. Supply Chain Attacks

**Ameaça**: Dependências comprometidas.

**Mitigações**:
- ✅ Lockfiles commitados (`package-lock.json`)
- ✅ Dependabot ativo
- ✅ `npm audit` / `yarn audit`
- ✅ SBOM (Software Bill of Materials)
- ✅ OSV Scanner

```bash
# Gerar SBOM (CycloneDX)
npm install -g @cyclonedx/cyclonedx-npm
cyclonedx-npm --output-file sbom.json

# Escanear vulnerabilidades
osv-scanner --sbom=sbom.json
```

### 7. Secret Leakage

**Ameaça**: Chaves privadas vazam no Git, logs ou backups.

**Mitigações**:
- ✅ `.gitignore` configurado
- ✅ Pre-commit hooks (gitleaks, truffleHog)
- ✅ Logs estruturados sem secrets
- ✅ Secret scanning no CI

```bash
# Pre-commit hook
#!/bin/bash
gitleaks detect --source . --verbose

if [ $? -ne 0 ]; then
  echo "❌ Secret detected! Commit blocked."
  exit 1
fi
```

---

## 🔍 Auditoria e Compliance

### Logs de Segurança

```typescript
// Eventos críticos sempre logados
logger.info({
  event: 'span.signed',
  spanId: span.id,
  publicKey: publicKey.substring(0, 16) + '...',  // Truncar
  timestamp: Date.now()
})

logger.warn({
  event: 'verification.failed',
  spanId: span.id,
  reason: 'Invalid signature',
  timestamp: Date.now()
})

logger.error({
  event: 'hash_chain.broken',
  expected: expectedHash,
  actual: actualHash,
  spanId: span.id
})
```

### Alertas Críticos

```typescript
// Configurar alertas para eventos suspeitos
if (failedVerifications > THRESHOLD) {
  await sendAlert({
    severity: 'critical',
    message: 'Multiple signature verification failures',
    count: failedVerifications,
    timeWindow: '5m'
  })
}
```

### Relatórios de Compliance

```typescript
// Gerar relatório de integridade
async function generateIntegrityReport() {
  const spans = await readAllSpans('ledger.ndjson')
  
  return {
    totalSpans: spans.length,
    signedSpans: spans.filter(s => s.signature).length,
    verifiedSpans: await verifyAll(spans),
    hashChainIntact: await verifyHashChain(spans),
    oldestSpan: spans[0].meta.timestamp,
    newestSpan: spans[spans.length - 1].meta.timestamp,
    generatedAt: Date.now()
  }
}
```

---

## 🧪 Testes de Segurança

### 1. Verificação de Assinaturas

```typescript
test('rejects tampered spans', async () => {
  const span = await createAndSignSpan()
  
  // Adulterar body
  span.body.amount = 9999999
  
  const valid = await verifySpan(span, { domain, publicKey })
  expect(valid).toBe(false)
})
```

### 2. Hash Chain

```typescript
test('detects broken hash chain', async () => {
  const spans = await createMultipleSpans(10)
  
  // Quebrar chain
  spans[5].previousHash = 'invalid-hash'
  
  const result = await verifyLedger(spans)
  expect(result.ok).toBe(false)
  expect(result.errors).toContainEqual({
    type: 'hash_chain_broken',
    spanId: spans[5].id
  })
})
```

### 3. Replay Protection

```typescript
test('rejects replayed spans', async () => {
  const span = await createAndSignSpan({
    meta: { timestamp: Date.now() - 10 * 60 * 1000 }  // 10 min atrás
  })
  
  const policy = { type: 'ttl', ttlMs: 5 * 60 * 1000 }  // 5 min max
  const decision = applyPolicy(span, policy)
  
  expect(decision.decision).toBe('deny')
  expect(decision.reason).toContain('expired')
})
```

---

## 📋 Checklist de Produção

### Antes do Deploy

- [ ] Chaves geradas com entropia forte
- [ ] Chaves armazenadas em secret manager
- [ ] Fail-fast se chaves ausentes
- [ ] TLS configurado e ativo
- [ ] Rate limiting habilitado
- [ ] Políticas de TTL configuradas
- [ ] Logs estruturados ativos
- [ ] Métricas e alertas configurados
- [ ] SBOM gerado
- [ ] Scanners de vulnerabilidade rodando no CI
- [ ] Backups automáticos configurados
- [ ] Plano de resposta a incidentes documentado

### Monitoramento Contínuo

- [ ] Alertas de falhas de verificação
- [ ] Alertas de hash chain quebrado
- [ ] Alertas de rate limiting
- [ ] Logs de segurança centralizados
- [ ] Dashboards de métricas
- [ ] Testes de integridade diários

### Resposta a Incidentes

Se detectar comprometimento:

1. **Isolar**: Parar sistema afetado
2. **Investigar**: Coletar logs e evidências
3. **Remediar**: Rotacionar chaves, restaurar backup
4. **Comunicar**: Notificar stakeholders
5. **Documentar**: Post-mortem e lições aprendidas

---

## 🔒 Política de Reporte de Vulnerabilidades

**NÃO abra issue pública para vulnerabilidades!**

Envie para: **security@jsonatomic.dev** (ou conforme SECURITY.md)

Inclua:
- Descrição da vulnerabilidade
- Steps to reproduce
- Impacto potencial
- Sugestão de fix (se tiver)

**Resposta esperada**: 48 horas
**Fix esperado**: 7 dias (críticas), 30 dias (baixas)

---

## 📚 Referências

- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Ed25519 Paper](https://ed25519.cr.yp.to/ed25519-20110926.pdf)
- [BLAKE3 Spec](https://github.com/BLAKE3-team/BLAKE3-specs)

---

**JSON✯Atomic** — Segurança criptográfica de ponta a ponta.
