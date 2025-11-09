# Política de Segurança

## Versões Suportadas

Apenas a versão mais recente do JSON✯Atomic recebe atualizações de segurança.

| Versão | Suportada          |
| ------ | ------------------ |
| 1.1.x  | :white_check_mark: |
| 1.0.x  | :x:                |
| < 1.0  | :x:                |

---

## Reportando uma Vulnerabilidade

**⚠️ NÃO reporte vulnerabilidades de segurança via Issues públicas do GitHub!**

Vulnerabilidades de segurança devem ser reportadas de forma privada para permitir correção antes de divulgação pública.

### Como Reportar

Envie um e-mail para: **security@jsonatomic.dev**

Ou use o recurso de [Security Advisories](https://github.com/danvoulez/JsonAtomic/security/advisories/new) do GitHub (recomendado).

### O que Incluir

Por favor, inclua o máximo de informações possível:

```markdown
**Descrição da Vulnerabilidade**
Descrição clara e técnica do problema.

**Tipo de Vulnerabilidade**
Ex: Injection, Broken Authentication, Cryptographic Failure, etc.

**Impacto**
Qual o potencial dano? (Confidencialidade, Integridade, Disponibilidade)

**Reprodução**
Passos detalhados para reproduzir:
1. Configure ambiente com...
2. Execute comando...
3. Observe comportamento...

**Proof of Concept**
Código/script que demonstra a vulnerabilidade (se aplicável).

**Versões Afetadas**
Quais versões do JSON✯Atomic são afetadas?

**Sugestão de Correção**
Se você tem uma ideia de como corrigir (opcional).

**Divulgação Coordenada**
Você pretende divulgar publicamente? Quando?
```

### Informações Adicionais

Se possível, inclua:

- Ambiente (OS, Node/Deno version, etc.)
- CVE relacionados (se aplicável)
- Referências técnicas
- Severity assessment (CVSS score, se tiver)

---

## Processo de Resposta

### Timeline Esperado

1. **Confirmação (48h)**: Confirmamos recebimento do reporte
2. **Triagem (7 dias)**: Avaliamos severidade e impacto
3. **Fix (30 dias)**: Desenvolvemos e testamos correção
4. **Release (45 dias)**: Publicamos versão corrigida
5. **Divulgação (60 dias)**: Divulgação pública coordenada

### Severidade

Classificamos vulnerabilidades usando CVSS 3.1:

- **Critical (9.0-10.0)**: Fix imediato, release em 7 dias
- **High (7.0-8.9)**: Fix prioritário, release em 14 dias
- **Medium (4.0-6.9)**: Fix em próximo release (30 dias)
- **Low (0.1-3.9)**: Fix quando conveniente

### Comunicação

- Manteremos você informado do progresso
- Creditaremos você no advisory (se desejar)
- Coordenaremos divulgação pública

---

## Vulnerabilidades Aceitáveis

Alguns cenários NÃO são considerados vulnerabilidades de segurança:

### Não Aplicável

- **Rate limiting bypass em ambiente de desenvolvimento** (desde que documentado para produção)
- **Informações vazadas em logs de debug** (se desabilitável em produção)
- **DoS requerendo recursos massivos** (attacks práticos apenas)
- **Vulnerabilidades em dependências** (reportar aos mantenedores upstream primeiro)

### Fora de Escopo

- **Engenharia social** (phishing, etc.)
- **Physical attacks** (acesso físico ao servidor)
- **Vulnerabilidades conhecidas** (já listadas em CHANGELOG/advisories)

Se não tiver certeza, reporte mesmo assim — preferimos avaliar.

---

## Divulgação Responsável

Pedimos que:

- **Não divulgue publicamente** antes do fix ser lançado
- **Não explore** a vulnerabilidade além do necessário para demonstrar
- **Não acesse/modifique** dados de terceiros
- **Nos dê tempo razoável** para corrigir (sugerimos 90 dias)

Em troca:

- **Creditaremos você** no security advisory
- **Manteremos você informado** do progresso
- **Consideraremos bug bounty** (se aplicável)

---

## Escopo de Segurança

### O que Protegemos

1. **Criptografia**
   - Geração de chaves Ed25519
   - Assinatura digital
   - Verificação de assinaturas
   - Hashing BLAKE3
   - Domain separation

2. **Integridade**
   - Hash chains
   - Ledger NDJSON
   - Verificação de spans
   - Detecção de adulteração

3. **Autenticação/Autorização**
   - API key validation
   - Rate limiting
   - Access control

4. **Input Validation**
   - Schema validation (Zod)
   - Type safety
   - Sanitization

### Fora do Escopo

- **Infraestrutura de deployment** (responsabilidade do usuário)
- **Segurança do SO** (patches, hardening)
- **Configuração incorreta** (chaves fracas, permissões erradas)
- **3rd party integrations** (LLMs, databases, etc.)

---

## Melhores Práticas de Segurança

Para usuários de JSON✯Atomic, recomendamos:

### Produção

- ✅ Use secret manager para chaves (AWS Secrets, Vault, etc.)
- ✅ Rotacione chaves regularmente (sugerimos 90 dias)
- ✅ Habilite TLS/SSL para APIs
- ✅ Configure rate limiting
- ✅ Monitore logs de segurança
- ✅ Mantenha dependências atualizadas
- ✅ Execute scanners de vulnerabilidade (npm audit, OSV-Scanner)

### Desenvolvimento

- ✅ Nunca commite chaves privadas
- ✅ Use `.env` e `.gitignore`
- ✅ Configure pre-commit hooks (gitleaks)
- ✅ Habilite linters de segurança
- ✅ Execute testes de segurança no CI

### Criptografia

- ✅ Gere chaves com entropia forte
- ✅ Nunca reutilize chaves entre ambientes
- ✅ Valide assinaturas em operações críticas
- ✅ Use domain separation
- ✅ Mantenha backups seguros de chaves

---

## Recursos de Segurança

### Documentação

- [Security.md](docs/security.md) - Modelo de segurança completo
- [Architecture.md](docs/architecture.md) - Decisões de design
- [Threat Model](THREAT_MODEL.md) - Análise de ameaças

### Ferramentas

- **npm audit**: Vulnerabilidades em dependências
- **OSV-Scanner**: Security vulnerabilities
- **Dependabot**: Automated dependency updates
- **CodeQL**: Static analysis
- **gitleaks**: Secret scanning

### Compliance

- **SBOM**: Gere com `cyclonedx-npm`
- **SLSA**: Provenance attestations (roadmap)
- **Signatures**: Releases assinadas (roadmap)

---

## Atualizações de Segurança

### Notificações

Assine para receber alertas:

- **GitHub Watch**: Click "Watch" → "Custom" → "Security alerts"
- **Release Notes**: Sempre listamos security fixes
- **Security Advisories**: GitHub Security tab

### Changelog

Todas as correções de segurança são documentadas em [CHANGELOG.md](CHANGELOG.md) com tag `[SECURITY]`.

---

## Agradecimentos

Agradecemos aos pesquisadores de segurança que reportam vulnerabilidades responsavelmente. Seu Hall of Fame:

*(Será atualizado conforme reportes forem recebidos e corrigidos)*

---

## Contato

- **Reportar vulnerabilidade**: security@jsonatomic.dev
- **Questões gerais**: Abra uma [Discussion](https://github.com/danvoulez/JsonAtomic/discussions)
- **Bugs não-security**: [Issues](https://github.com/danvoulez/JsonAtomic/issues)

---

**JSON✯Atomic** — Segurança criptográfica de ponta a ponta. 🔒
