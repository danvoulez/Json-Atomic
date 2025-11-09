# Contribuindo para JSON✯Atomic

Obrigado por considerar contribuir para JSON✯Atomic! 🎉

Este documento fornece diretrizes para contribuir com código, documentação e melhorias ao projeto.

---

## 📋 Código de Conduta

Ao participar deste projeto, você concorda em seguir nosso [Code of Conduct](CODE_OF_CONDUCT.md). Por favor, leia-o antes de contribuir.

---

## 🚀 Como Contribuir

### Formas de Contribuição

Valorizamos todos os tipos de contribuição:

- 🐛 **Reportar bugs**
- 💡 **Sugerir features**
- 📝 **Melhorar documentação**
- 🧪 **Adicionar testes**
- 🔧 **Corrigir bugs**
- ✨ **Implementar features**
- 🌍 **Traduzir documentação**
- 📊 **Melhorar exemplos**

---

## 🐛 Reportar Bugs

### Antes de Reportar

1. Verifique se o bug já foi reportado nas [Issues](https://github.com/danvoulez/JsonAtomic/issues)
2. Teste com a versão mais recente
3. Colete informações sobre o ambiente (Node/Deno version, OS, etc.)

### Template de Bug Report

```markdown
**Descrição**
Descrição clara e concisa do bug.

**Reproduzir**
Passos para reproduzir:
1. Execute '...'
2. Chame função '...'
3. Observe erro

**Comportamento Esperado**
O que deveria acontecer.

**Comportamento Atual**
O que está acontecendo.

**Ambiente**
- OS: [ex: Ubuntu 22.04]
- Runtime: [ex: Node 20.5.0]
- Versão JSON✯Atomic: [ex: 1.1.0]

**Logs/Screenshots**
Cole logs ou screenshots relevantes.
```

---

## 💡 Sugerir Features

Adoramos ideias novas! Para sugerir uma feature:

1. Abra uma [Issue](https://github.com/danvoulez/JsonAtomic/issues/new) com tag `enhancement`
2. Descreva o problema que a feature resolve
3. Proponha uma solução (se tiver)
4. Discuta alternativas

### Template de Feature Request

```markdown
**Problema**
Descreva o problema que essa feature resolveria.

**Solução Proposta**
Como você imagina que isso funcionaria?

**Alternativas**
Outras abordagens que você considerou?

**Contexto Adicional**
Screenshots, exemplos, referências, etc.
```

---

## 🔧 Contribuir com Código

### Setup do Ambiente

1. **Fork o repositório**

```bash
# Via GitHub UI ou:
gh repo fork danvoulez/JsonAtomic
```

2. **Clone seu fork**

```bash
git clone https://github.com/SEU-USUARIO/JsonAtomic.git
cd JsonAtomic
```

3. **Instalar dependências**

```bash
# Node.js
npm install

# ou pnpm (recomendado)
pnpm install
```

4. **Configurar Git**

```bash
git config user.name "Seu Nome"
git config user.email "seu@email.com"
```

5. **Criar branch**

```bash
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-bugfix
```

### Padrões de Código

#### TypeScript

- **Strict mode** habilitado
- **Sem `any`** (use `unknown` se necessário)
- **ESLint** deve passar sem warnings
- **Prettier** para formatação

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

#### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
<tipo>(<escopo>): <descrição>

# Exemplos
feat(crypto): add BLAKE3 hashing support
fix(ledger): correct hash chain validation
docs(readme): update installation instructions
test(span): add signature verification tests
chore(deps): update @noble/hashes to 1.4.0
```

**Tipos**:
- `feat`: Nova feature
- `fix`: Correção de bug
- `docs`: Apenas documentação
- `test`: Adicionar/corrigir testes
- `refactor`: Refatoração sem mudar funcionalidade
- `perf`: Melhoria de performance
- `chore`: Manutenção (deps, config, etc.)

#### Testes

- **Todos os testes devem passar**: `npm test`
- **Coverage mínimo**: 80%
- **Adicionar testes** para novas features

```bash
# Rodar todos os testes
npm test

# Com coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

#### Estrutura de Teste

```typescript
describe('createSpan', () => {
  it('should create span with valid id', () => {
    const span = createSpan({ type: 'test', body: {} })
    expect(span.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}/)
  })
  
  it('should throw on invalid type', () => {
    expect(() => createSpan({ type: '', body: {} }))
      .toThrow('type cannot be empty')
  })
})
```

---

## 📝 Contribuir com Documentação

Documentação é crucial! Para melhorar:

1. Encontre typos/erros
2. Adicione exemplos
3. Melhore clareza
4. Traduza para outros idiomas

**Localização dos docs**:
- README principal: `README.md`
- Documentação técnica: `docs/`
- Exemplos: `examples/`
- API reference: `docs/api/`

---

## 🔍 Code Review

Após abrir um Pull Request:

1. **CI deve passar**: Todos os checks (lint, test, build)
2. **Coverage mantido**: Não diminuir cobertura de testes
3. **Código limpo**: Seguir padrões estabelecidos
4. **Docs atualizadas**: Se necessário
5. **Changelog atualizado**: Para features/fixes notáveis

### Processo de Review

- Pelo menos **1 aprovação** necessária
- Mudanças podem ser solicitadas
- Discuta abertamente e respeitosamente
- Seja paciente — reviewers são voluntários

---

## 🔒 Segurança

**⚠️ NÃO reporte vulnerabilidades de segurança via Issues públicas!**

Use o canal privado descrito em [SECURITY.md](SECURITY.md).

---

## 📦 Releases

Apenas mantenedores fazem releases. O processo:

1. Atualizar versão em `package.json`
2. Atualizar `CHANGELOG.md`
3. Criar tag Git: `git tag v1.2.0`
4. Push tag: `git push origin v1.2.0`
5. CI publica automaticamente no npm

---

## ✅ Checklist de PR

Antes de abrir um Pull Request, verifique:

- [ ] Branch atualizado com `main`
- [ ] Código segue padrões (lint passa)
- [ ] Testes adicionados/atualizados
- [ ] Testes passam (`npm test`)
- [ ] Documentação atualizada (se aplicável)
- [ ] Commits seguem Conventional Commits
- [ ] CHANGELOG atualizado (se feature/fix importante)
- [ ] Nenhum segredo commitado
- [ ] PR tem descrição clara

---

## 🎯 Boas Práticas

### Pull Requests

- **Pequenos e focados**: Uma feature/fix por PR
- **Título descritivo**: Siga Conventional Commits
- **Descrição clara**: Explique o problema e solução
- **Screenshots**: Se mudança visual
- **Breaking changes**: Destacar claramente

### Código

- **KISS**: Keep It Simple, Stupid
- **DRY**: Don't Repeat Yourself
- **YAGNI**: You Aren't Gonna Need It
- **Testes primeiro**: TDD quando possível
- **Comentários úteis**: Explique o "porquê", não o "o quê"

---

## 🏗️ Arquitetura

Familiarize-se com a estrutura:

```
JsonAtomic/
├── core/           # Lógica principal
│   ├── crypto/     # Assinatura, verificação
│   ├── ledger/     # Operações de ledger
│   ├── policies/   # Políticas (TTL, throttle)
│   └── observability/ # Logs, métricas
├── api/            # API REST
├── tools/          # CLI e utilitários
├── schemas/        # JSON schemas
├── tests/          # Testes
├── docs/           # Documentação
└── examples/       # Exemplos práticos
```

Leia [Architecture.md](docs/architecture.md) para entender design decisions.

---

## 🤝 Comunidade

- **GitHub Discussions**: Para perguntas e discussões
- **Issues**: Para bugs e features
- **Pull Requests**: Para contribuições de código

---

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a [Licença MIT](LICENSE).

---

## 🙏 Agradecimentos

Toda contribuição é valorizada! Você será adicionado aos contributors automaticamente pelo GitHub.

---

**Obrigado por contribuir para JSON✯Atomic!** 🚀

Se tiver dúvidas, abra uma [Discussion](https://github.com/danvoulez/JsonAtomic/discussions) ou [Issue](https://github.com/danvoulez/JsonAtomic/issues).
