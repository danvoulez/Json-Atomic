# Minicore Browser Build Guide

## Overview

Minicore agora roda 100% no Chrome (e navegadores modernos) com:
- ✅ **Web Worker Sandbox** - isolamento real, sem acesso ao DOM
- ✅ **Timeout real** - via `worker.terminate()`
- ✅ **Bundle ESM** - sem dependências Node/Deno
- ✅ **Crypto nativa** - BLAKE3 + Ed25519 via @noble
- ✅ **UI funcional** - `runtime.html` com execução completa

## Build

### 1. Gerar bundle para browser

```bash
cd minicore
deno task build:browser
```

Isso gera:
- `dist/browser/minicore.browser.js` - SDK principal
- `dist/browser/minicore.worker.js` - Web Worker

### 2. Servir localmente

```bash
deno task serve:demo
```

Abre em: http://localhost:8080

## Estrutura

```
minicore/
├── src/
│   ├── adapters/
│   │   └── sandbox.browser.ts    # Adapter Web Worker
│   ├── workers/
│   │   └── sandbox.worker.ts     # Worker isolado
│   └── sandbox.ts                # Roteador de runtime
├── scripts/
│   └── build_browser.ts          # Build com esbuild
├── tests/
│   └── browser/
│       └── index.html            # Testes automatizados
├── runtime.html                  # Playground UI
└── dist/browser/                 # Bundles gerados
    ├── minicore.browser.js
    └── minicore.worker.js
```

## Testes

### Testes automatizados

Depois do build, abra:
```
file:///path/to/minicore/tests/browser/index.html
```

ou via servidor:
```bash
deno task serve:demo
# Abrir: http://localhost:8080/tests/browser/
```

Testa:
1. ✅ Execução básica (retorno correto)
2. ✅ Timeout (infinite loop detectado)
3. ✅ Context variables (acesso ao contexto)
4. ✅ Async/await (código assíncrono)
5. ✅ Error handling (captura erros)
6. ✅ Minicore SDK (execute completo)
7. ✅ Sign & Verify (BLAKE3 + Ed25519)
8. ✅ Policy enforcement (TTL)

### Playground interativo

Depois do build, abra:
```
file:///path/to/minicore/runtime.html
```

ou:
```bash
deno task serve:demo
# Abrir: http://localhost:8080/runtime.html
```

## Uso no Browser

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Minicore Example</title>
</head>
<body>
  <script type="module">
    import { Minicore } from './dist/browser/minicore.browser.js'

    const minicore = new Minicore({ timeout: 3000 })

    // Executar código
    const result = await minicore.execute({
      kind: 'run_code',
      input: {
        code: 'return 2 + 2',
        context: {}
      }
    })

    console.log(result.output)      // 4
    console.log(result.hash)        // BLAKE3 hash
    console.log(result.signature)   // Ed25519 signature
  </script>
</body>
</html>
```

## Segurança

### Web Worker Sandbox

**O que bloqueia:**
- ❌ DOM access (sem `window`, `document`)
- ❌ Network (sem `fetch` exposto)
- ❌ File system (sem acesso a disco)
- ❌ Parent scope (contexto isolado)

**O que permite:**
- ✅ Variáveis do `context` (via parâmetros)
- ✅ Código puro JS/ES2020
- ✅ Async/await, Promises
- ✅ Math, Date, JSON (APIs seguras)

**Timeout real:**
- Host mede tempo e chama `worker.terminate()` ao estourar
- Worker não pode escapar do timeout

### Diferença vs Deno/Node

| Ambiente | Isolamento | Timeout | Método |
|----------|-----------|---------|--------|
| Browser | Web Worker | Real (terminate) | `BrowserSandbox` |
| Deno | `new Function` | Promise.race | Fallback inline |
| Node | `new Function` | Promise.race | Fallback inline |

## Dependências

Todas funcionam no browser sem polyfills:
- `@noble/hashes` - BLAKE3 puro JS
- `@noble/curves` - Ed25519 puro JS

Sem Node.js:
- ❌ `fs`, `process`, `crypto` (Node built-ins)
- ✅ `globalThis`, `performance`, `Worker` (Web APIs)

## Troubleshooting

### Build falha

```bash
# Garantir que Deno está instalado
deno --version

# Limpar cache se necessário
rm -rf dist/browser
deno task build:browser
```

### Worker não carrega

- Certifique-se de servir via HTTP (não `file://` em alguns browsers)
- Use `deno task serve:demo` ou outro servidor local

### CORS errors

- Servir tudo do mesmo origin
- Headers CORS não são necessários (tudo local)

## Próximos Passos

1. **CDN deploy** - publicar bundles em JSR/npm CDN
2. **Minify** - ativar minificação no build de produção
3. **Source maps** - já habilitado para debug
4. **Testes E2E** - Playwright/Puppeteer para CI

## Definição de Sucesso (DoD)

- [x] Abrir `runtime.html` no Chrome (local)
- [x] Executar `examples/demo_span.json` → status: "ok"
- [x] Timeout funciona (`while(true){}` → `timedOut: true`)
- [x] Assinar e verificar span
- [x] Exportar NDJSON
- [x] Bundle não importa Deno/Node built-ins
- [x] Sem fetch externo

---

**Status**: ✅ Implementado e pronto para testes!
