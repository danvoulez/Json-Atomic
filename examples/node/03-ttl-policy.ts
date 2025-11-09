/**
 * Exemplo 3: Política TTL (Time To Live)
 * 
 * Este exemplo demonstra:
 * 1. Como aplicar política de TTL
 * 2. Rejeitar spans muito antigos
 * 3. Prevenir replay attacks
 */

import { createSpan, signSpan, applyPolicy } from '../../index'
import * as dotenv from 'dotenv'

dotenv.config()

const domain = 'demo'
const privateKey = process.env.PRIVATE_KEY

if (!privateKey) {
  console.error('❌ PRIVATE_KEY não configurada!')
  process.exit(1)
}

async function main() {
  console.log('🚀 Exemplo 3: Política TTL\n')
  
  // Configurar política: spans devem ter menos de 5 minutos
  const ttlPolicy = {
    type: 'ttl' as const,
    ttlMs: 5 * 60 * 1000  // 5 minutos
  }
  
  console.log(`⚙️  Política configurada: TTL de ${ttlPolicy.ttlMs / 1000}s\n`)
  
  // Teste 1: Span recente (deve passar)
  console.log('Test 1: Span RECENTE')
  const recentSpan = createSpan({
    type: 'user.action',
    body: { action: 'click', button: 'submit' },
    meta: {
      timestamp: Date.now(),  // Agora
      traceId: 'trace-1'
    }
  })
  
  const signedRecent = await signSpan(recentSpan, { domain, privateKey })
  
  const decision1 = applyPolicy('ttl', {
    span: signedRecent,
    now: Date.now(),
    config: ttlPolicy
  })
  
  console.log(`   Decisão: ${decision1.decision}`)
  if (decision1.decision === 'allow') {
    console.log('   ✅ Span aceito (dentro do TTL)')
  } else {
    console.log(`   ❌ Span rejeitado: ${decision1.reason}`)
  }
  console.log()
  
  // Teste 2: Span antigo (deve falhar)
  console.log('Test 2: Span EXPIRADO')
  const oldSpan = createSpan({
    type: 'user.action',
    body: { action: 'click', button: 'cancel' },
    meta: {
      timestamp: Date.now() - (10 * 60 * 1000),  // 10 minutos atrás
      traceId: 'trace-2'
    }
  })
  
  const signedOld = await signSpan(oldSpan, { domain, privateKey })
  
  const decision2 = applyPolicy('ttl', {
    span: signedOld,
    now: Date.now(),
    config: ttlPolicy
  })
  
  console.log(`   Decisão: ${decision2.decision}`)
  if (decision2.decision === 'deny') {
    console.log(`   ❌ Span rejeitado: ${decision2.reason}`)
    console.log('   (Preveniu replay attack ou processamento de evento antigo)')
  } else {
    console.log('   ✅ Span aceito')
  }
  console.log()
  
  // Teste 3: Span no limite
  console.log('Test 3: Span NO LIMITE')
  const limitSpan = createSpan({
    type: 'user.action',
    body: { action: 'scroll', position: 100 },
    meta: {
      timestamp: Date.now() - (4 * 60 * 1000 + 59 * 1000),  // 4m59s atrás
      traceId: 'trace-3'
    }
  })
  
  const signedLimit = await signSpan(limitSpan, { domain, privateKey })
  
  const decision3 = applyPolicy('ttl', {
    span: signedLimit,
    now: Date.now(),
    config: ttlPolicy
  })
  
  console.log(`   Decisão: ${decision3.decision}`)
  if (decision3.decision === 'allow') {
    console.log('   ✅ Span aceito (ainda dentro do TTL)')
  } else {
    console.log(`   ❌ Span rejeitado: ${decision3.reason}`)
  }
  console.log()
  
  // Demonstrar uso prático
  console.log('💡 Uso Prático:\n')
  console.log('// Em produção, aplicar TTL antes de processar spans')
  console.log('async function processSpan(span) {')
  console.log('  const decision = applyPolicy("ttl", {')
  console.log('    span,')
  console.log('    now: Date.now(),')
  console.log('    config: { type: "ttl", ttlMs: 5 * 60 * 1000 }')
  console.log('  })')
  console.log('')
  console.log('  if (decision.decision === "deny") {')
  console.log('    logger.warn({ spanId: span.id, reason: decision.reason })')
  console.log('    return { status: "rejected", reason: decision.reason }')
  console.log('  }')
  console.log('')
  console.log('  // Processar span...')
  console.log('  return { status: "processed" }')
  console.log('}')
  console.log()
  
  console.log('🎯 Benefícios da Política TTL:')
  console.log('   ✅ Previne replay attacks')
  console.log('   ✅ Rejeita eventos obsoletos')
  console.log('   ✅ Mantém sistema sincronizado')
  console.log('   ✅ Facilita debugging (eventos fora de ordem)')
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
