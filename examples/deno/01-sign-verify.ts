/**
 * Exemplo 1 (Deno): Criar, Assinar e Verificar Span
 */

import { createSpan, signSpan, verifySpan } from '../../index.ts'
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts"

const env = await load()

const domain = 'demo-json-atomic'
const privateKey = env.PRIVATE_KEY
const publicKey = env.PUBLIC_KEY

if (!privateKey || !publicKey) {
  console.error('❌ PRIVATE_KEY ou PUBLIC_KEY não configuradas!')
  console.error('Configure no arquivo .env')
  Deno.exit(1)
}

async function main() {
  console.log('🦕 Deno - Exemplo 1: Criar → Assinar → Verificar\n')
  
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
      source: 'deno-example'
    }
  })
  
  console.log('✅ Span criado:', span.id)
  
  // 2. Assinar
  const signed = await signSpan(span, { domain, privateKey })
  console.log('✅ Span assinado')
  console.log(`   Algoritmo: ${signed.signature.alg}`)
  console.log(`   Assinatura: ${signed.signature.sig.substring(0, 32)}...`)
  
  // 3. Verificar
  const valid = await verifySpan(signed, { domain, publicKey })
  
  if (valid) {
    console.log('✅ Assinatura VÁLIDA!')
  } else {
    console.error('❌ Assinatura INVÁLIDA!')
    Deno.exit(1)
  }
  
  console.log('\n🎉 Sucesso! JSON✯Atomic funcionando no Deno!')
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  Deno.exit(1)
})
