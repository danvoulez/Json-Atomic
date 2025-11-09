# JSON✯Atomic — Visão Geral

## O que é JSON✯Atomic?

**JSON✯Atomic** é um backend leve e versátil que fala uma língua universal (JSON canônico) e é AI-native desde o dia 1. Desenvolvido para apps modernos, integrações entre sistemas e comunicação com LLMs, JSON✯Atomic oferece trilha auditável e provas criptográficas de ponta a ponta.

### One-liner
> JSON✯Atomic é o backend leve e versátil que fala uma língua universal — perfeita para apps, integrações e LLMs — com trilha auditável e provas criptográficas de ponta a ponta.

---

## 🎯 Filosofia do Projeto

### Universalidade
Protocolo e dados em JSON canônico (JSON Atomic), exportável, estável, fácil de assinar, verificar e versionar. Não importa onde seus dados vivem — JSON✯Atomic fornece a linguagem comum.

### AI-Native
Pensado para LLMs desde o primeiro dia:
- Semântica clara e estruturada
- Mensagens padronizadas
- "Promptability" — fácil de descrever e consumir por modelos
- Exemplos prontos para uso

### Ledger-Only & Append-Only
Tudo gera rastro comprovável. Nada é modificado ou deletado — apenas adicionado. Facilita auditoria, debugging e conformidade.

### Criptografia Moderna
- **BLAKE3**: hashing ultrarrápido e seguro
- **Ed25519**: assinaturas digitais de ponta
- Domain separation por padrão

### Políticas Computáveis
Regras legíveis, determinísticas e auditáveis:
- Throttling
- TTL (Time To Live)
- Retry policies
- Slow-mode
- Circuit breakers

### Portabilidade Total
- Roda em Node.js ou Deno
- Containers simples
- Zero dependências esotéricas
- Deploy anywhere

### DX em Primeiro Lugar
- Quickstart em 5–10 minutos
- Exemplos úteis e copy-paste
- README que não mente
- Documentação honesta

---

## 💡 Casos de Uso

### 1. Integração Multi-Sistema
Padronize a comunicação entre microsserviços, APIs legadas e sistemas modernos usando JSON canônico com provas criptográficas.

**Exemplo**: Conectar sistema de pagamentos, CRM e analytics mantendo trilha auditável de cada transação.

### 2. Governança e Compliance
Mantenha registro imutável de decisões, mudanças de estado e ações críticas com assinaturas verificáveis.

**Exemplo**: Sistema de aprovações financeiras onde cada decisão é assinada e rastreável.

### 3. AI/LLM Integration
Forneça contexto estruturado e verificável para LLMs, garantindo rastreabilidade das interações.

**Exemplo**: Chatbot que registra cada prompt e resposta como spans assinados, permitindo auditoria completa.

### 4. Observabilidade Avançada
Rastreamento distribuído com garantias criptográficas de que os logs não foram alterados.

**Exemplo**: Sistema de tracing onde cada span é assinado, impedindo adulteração de dados de debugging.

### 5. Event Sourcing
Store de eventos com garantia de ordem e integridade criptográfica.

**Exemplo**: Sistema bancário onde cada transação vira um evento imutável e verificável.

---

## 🏗️ Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                     Applications / Clients                   │
│           (Node.js, Deno, Browser, Python, etc.)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   JSON✯Atomic Core Library    │
         │  - createSpan()                │
         │  - signSpan()                  │
         │  - verifySpan()                │
         │  - applyPolicy()               │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │    Ledger (NDJSON)            │
         │  - Append-only                 │
         │  - Hash chain                  │
         │  - Signatures                  │
         └───────────┬───────────────────┘
                     │
        ┌────────────┴──────────────┐
        ▼                           ▼
┌───────────────┐         ┌──────────────────┐
│  Verification │         │  Policy Engine   │
│  - BLAKE3     │         │  - TTL           │
│  - Ed25519    │         │  - Throttle      │
│  - Hash chain │         │  - Retry         │
└───────────────┘         └──────────────────┘
```

---

## 🚀 Principais Diferenciais

### Língua Universal
Objetos JSON canônicos e estáveis que funcionam em qualquer stack.

### Integridade Verificável
BLAKE3 + Ed25519 por evento (span) e por lote. Qualquer alteração é detectada.

### Ledger NDJSON
Formato simples, fácil de inspecionar, replicar e versionar. Não precisa de banco especial.

### Políticas com Rastro
Throttling, TTL, retry — tudo computável e com trilha de auditoria.

### Observabilidade Built-in
Métricas Prometheus, health checks, logs estruturados com traceId.

### Zero Vendor Lock-in
Roda em qualquer lugar. Seus dados são seus, em formato aberto.

---

## 📊 Status do Projeto

**Versão Atual**: 1.1.0  
**Status**: Production-ready com hardening completo  
**Licença**: MIT

### O que está pronto
✅ Core library (TypeScript)  
✅ CLI tools (Deno)  
✅ Assinatura e verificação Ed25519  
✅ Ledger NDJSON com hash chain  
✅ Políticas básicas (TTL, throttle)  
✅ Observabilidade (logs, métricas, health)  
✅ Playground UI  
✅ Testes abrangentes  
✅ Documentação técnica  

### Roadmap
🔄 Benchmarks e testes de carga  
🔄 Mais exemplos de integração com LLMs  
🔄 Políticas avançadas (circuit-breaker, quota)  
🔄 Atestações SLSA para imagens e pacotes  

---

## 🌍 Comunidade

**Repositório**: https://github.com/danvoulez/JsonAtomic  
**Documentação**: Veja os docs/ para guias detalhados  
**Licença**: MIT — use livremente  

---

## 🎓 Por Onde Começar

1. **Instalação**: Veja [getting-started.md](./getting-started.md)
2. **Arquitetura**: Entenda os conceitos em [architecture.md](./architecture.md)
3. **Segurança**: Leia [security.md](./security.md)
4. **Exemplos**: Explore [../examples/](../examples/)
5. **API**: Consulte [api/openapi.md](./api/openapi.md)

---

## 💬 Questões Frequentes

**P: JSON✯Atomic substitui meu banco de dados?**  
R: Não. Ele fornece rastro verificável e linguagem de integração. Use-o como fonte de verdade auditável ao lado do seu banco.

**P: Funciona só com Node ou só com Deno?**  
R: Ambos! O projeto é portável — escolha o runtime que preferir.

**P: Como garanto que meu ledger não foi adulterado?**  
R: O verificador reconstrói a hash chain e valida assinaturas Ed25519. Qualquer alteração quebra a cadeia.

**P: Posso usar em produção hoje?**  
R: Sim! A versão 1.1.0 passou por hardening completo de segurança e testes abrangentes.

---

**JSON✯Atomic** — Um backend leve que fala a língua universal dos seus sistemas e dos seus LLMs.
