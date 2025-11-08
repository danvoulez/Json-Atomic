# 8. Fluxos avançados de políticas: TTL, Fallback, Chain

## TTL Policy (Tempo de Vida)
```json
{
  "policy": {
    "ttl": 10,
    "if_not": "fallback-action"
  }
}
```
Span será "expirado" se não for executado em até 10 segundos após started_at (observer/policy-agent aciona if_not).

---

## Fallback policy chain

```json
{
  "policy": {
    "if_error": {
      "action": "retry",
      "target": "/task",
      "params": { "attempt": 2 }
    }
  }
}
```

Após erro, nova atomic de retry é criada e appendada.

---

## Policy chaining

```json
{
  "policy": {
    "if_ok": "next-step",
    "if_not": { "action": "alert-admin" },
    "if_doubt": { "action": "notify", "target": "/ops" }
  }
}
```

---
## Throttle

```json
{
  "policy": {
    "throttle": 30
  }
}
```
É permitido executar apenas um span por 30 segundos (policy-agent deve controlar).

---

**Diagrama de Avaliação de Políticas**
```
[span.pending]
   ↓ policy-agent
+--[TTL]---+---[fallback]---+
|         |                |
[completed]            [error]---[retry]
```
---

Aplique e combine políticas conforme o fluxo de governança desejado.  
Consulte exemplos em `core/contracts/validator.ts` ou peça exemplos práticos!