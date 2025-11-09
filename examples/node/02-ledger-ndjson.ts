/**
 * Exemplo 2: Ledger NDJSON
 * 
 * Este exemplo demonstra:
 * 1. Criar múltiplos spans
 * 2. Assinar cada um
 * 3. Salvar em arquivo NDJSON (uma linha por span)
 * 4. Verificar integridade do ledger (assinaturas + hash chain)
 */

import { createSpan, signSpan, verifyLedgerFile } from '../../index'
import { writeFileSync, appendFileSync, existsSync } from 'node:fs'
import * as dotenv from 'dotenv'

dotenv.config()

const domain = 'demo'
const privateKey = process.env.PRIVATE_KEY
const publicKey = process.env.PUBLIC_KEY
const ledgerPath = '/tmp/ledger-example.ndjson'

if (!privateKey || !publicKey) {
  console.error('❌ Chaves não configuradas!')
  process.exit(1)
}

// Eventos de exemplo
const events = [
  {
    type: 'user.created',
    body: { userId: 'u_001', email: 'alice@example.com', plan: 'free' }
  },
  {
    type: 'user.upgraded',
    body: { userId: 'u_001', from: 'free', to: 'pro', amount: 99.99 }
  },
  {
    type: 'payment.processed',
    body: { paymentId: 'pay_123', amount: 99.99, status: 'success' }
  },
  {
    type: 'email.sent',
    body: { to: 'alice@example.com', subject: 'Welcome to Pro!', template: 'upgrade' }
  },
  {
    type: 'analytics.event',
    body: { event: 'upgrade_completed', userId: 'u_001', revenue: 99.99 }
  }
]

async function createLedger() {
  console.log('🚀 Exemplo 2: Ledger NDJSON\n')
  
  // Limpar ledger anterior se existir
  if (existsSync(ledgerPath)) {
    console.log('🗑️  Removendo ledger anterior...')
    writeFileSync(ledgerPath, '')
  }
  
  console.log(`📝 Criando ledger em: ${ledgerPath}\n`)
  
  let previousHash: string | undefined = undefined
  
  for (const [index, event] of events.entries()) {
    console.log(`[${index + 1}/${events.length}] Processando: ${event.type}`)
    
    // Criar span
    const span = createSpan({
      ...event,
      meta: {
        traceId: `trace-${Date.now()}`,
        timestamp: Date.now(),
        index
      }
    })
    
    // Adicionar hash do anterior (hash chain)
    if (previousHash) {
      span.previousHash = previousHash
    }
    
    // Assinar
    const signed = await signSpan(span, { domain, privateKey })
    
    // Converter para NDJSON (uma linha)
    const line = JSON.stringify(signed) + '\n'
    
    // Append ao arquivo
    appendFileSync(ledgerPath, line)
    
    console.log(`   ✅ Salvo: ${span.id}`)
    
    // Atualizar hash para próximo
    previousHash = computeSimpleHash(signed)
  }
  
  console.log(`\n✅ Ledger criado com ${events.length} spans`)
  console.log()
}

async function verifyLedger() {
  console.log('🔍 Verificando integridade do ledger...\n')
  
  const result = await verifyLedgerFile(ledgerPath, {
    domain,
    publicKeys: [publicKey]
  })
  
  console.log('📊 Resultado da verificação:')
  console.log(`   Total de spans: ${result.summary.total}`)
  console.log(`   Válidos: ${result.summary.valid}`)
  console.log(`   Inválidos: ${result.summary.invalid}`)
  console.log(`   Hash chain OK: ${result.summary.hashChain}`)
  console.log(`   Forks detectados: ${result.summary.forks}`)
  console.log()
  
  if (result.ok) {
    console.log('✅ Ledger ÍNTEGRO!')
    console.log('   Todas as assinaturas são válidas e a hash chain está intacta.')
  } else {
    console.error('❌ Ledger COMPROMETIDO!')
    console.error('Erros encontrados:', result.errors)
    process.exit(1)
  }
}

// Função auxiliar para hash simples (apenas para demo)
function computeSimpleHash(obj: any): string {
  const str = JSON.stringify(obj)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `blake3:${Math.abs(hash).toString(16)}`
}

async function main() {
  await createLedger()
  await verifyLedger()
  
  console.log()
  console.log('💡 Experimente:')
  console.log(`   - Abrir ${ledgerPath} e ver os spans`)
  console.log('   - Modificar um span no arquivo e verificar novamente')
  console.log('   - Usar jq para filtrar: cat ledger.ndjson | jq ".type"')
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
