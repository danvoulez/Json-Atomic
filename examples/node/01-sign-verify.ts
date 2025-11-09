/**
 * Exemplo 1: Criar, Assinar e Verificar Span
 * 
 * Este exemplo demonstra o fluxo básico:
 * 1. Criar um span
 * 2. Assinar com Ed25519
 * 3. Verificar a assinatura
 */

import { createSpan, signSpan, verifySpan } from '../../index'
import * as dotenv from 'dotenv'

dotenv.config()

const domain = 'demo-json-atomic'

// Carregar chaves do ambiente
const privateKey = process.env.PRIVATE_KEY
const publicKey = process.env.PUBLIC_KEY

if (!privateKey || !publicKey) {
  console.error('❌ PRIVATE_KEY ou PUBLIC_KEY não configuradas!')
  console.error('Configure no arquivo .env ou variáveis de ambiente')
  process.exit(1)
}

async function main() {
  console.log('🚀 Exemplo 1: Criar → Assinar → Verificar\n')
  
  // 1. Criar span
  console.log('📝 Criando span...')
  const span = createSpan({
    type: 'user.signup',
    body: {
      userId: 'u_12345',
      email: 'usuario@exemplo.com',
      plan: 'pro',
      referrer: 'homepage'
    },
    meta: {
      traceId: 'trace-' + Date.now(),
      source: 'web-app',
      userAgent: 'Mozilla/5.0...'
    }
  })
  
  console.log('✅ Span criado:')
  console.log(`   ID: ${span.id}`)
  console.log(`   Tipo: ${span.type}`)
  console.log(`   Body:`, JSON.stringify(span.body, null, 2))
  console.log()
  
  // 2. Assinar span
  console.log('🔐 Assinando span...')
  const signed = await signSpan(span, { domain, privateKey })
  
  console.log('✅ Span assinado:')
  console.log(`   Algoritmo: ${signed.signature.alg}`)
  console.log(`   Assinatura: ${signed.signature.sig.substring(0, 32)}...`)
  console.log(`   Assinado em: ${signed.signature.signed_at}`)
  console.log()
  
  // 3. Verificar assinatura
  console.log('🔍 Verificando assinatura...')
  const valid = await verifySpan(signed, { domain, publicKey })
  
  if (valid) {
    console.log('✅ Assinatura VÁLIDA!')
    console.log('   O span não foi adulterado e foi assinado pela chave correta.')
  } else {
    console.error('❌ Assinatura INVÁLIDA!')
    console.error('   O span pode ter sido adulterado ou assinado com chave diferente.')
    process.exit(1)
  }
  
  console.log()
  console.log('🎉 Sucesso! Fluxo completo executado.')
  console.log()
  console.log('💡 Próximos passos:')
  console.log('   - Tente modificar o span.body e verificar novamente (deve falhar)')
  console.log('   - Salve múltiplos spans em um ledger NDJSON')
  console.log('   - Aplique políticas como TTL')
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
