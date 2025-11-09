/**
 * Exemplo 4: Métricas e Observabilidade
 * 
 * Este exemplo demonstra:
 * 1. Coletar métricas de spans criados
 * 2. Medir latência de operações
 * 3. Exportar métricas para Prometheus
 */

import { createSpan, signSpan } from '../../index'
import { Counter, Histogram, register } from 'prom-client'
import * as dotenv from 'dotenv'

dotenv.config()

const domain = 'metrics-demo'
const privateKey = process.env.PRIVATE_KEY

if (!privateKey) {
  console.error('❌ PRIVATE_KEY não configurada!')
  process.exit(1)
}

// Definir métricas Prometheus
const spansCreated = new Counter({
  name: 'jsonatomic_spans_created_total',
  help: 'Total de spans criados',
  labelNames: ['type']
})

const spansProcessed = new Counter({
  name: 'jsonatomic_spans_processed_total',
  help: 'Total de spans processados',
  labelNames: ['type', 'status']
})

const signLatency = new Histogram({
  name: 'jsonatomic_sign_duration_seconds',
  help: 'Tempo para assinar span',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
})

const processLatency = new Histogram({
  name: 'jsonatomic_process_duration_seconds',
  help: 'Tempo total de processamento',
  labelNames: ['type']
})

async function processEvent(type: string, body: any) {
  const endProcessTimer = processLatency.startTimer({ type })
  
  try {
    // 1. Criar span
    const span = createSpan({
      type,
      body,
      meta: {
        timestamp: Date.now(),
        traceId: 'trace-' + Date.now()
      }
    })
    
    spansCreated.inc({ type })
    
    // 2. Assinar (com medição de latência)
    const endSignTimer = signLatency.startTimer()
    const signed = await signSpan(span, { domain, privateKey })
    endSignTimer()
    
    // 3. Simular processamento
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
    
    spansProcessed.inc({ type, status: 'success' })
    
    return { status: 'success', spanId: signed.id }
    
  } catch (err) {
    spansProcessed.inc({ type, status: 'error' })
    throw err
  } finally {
    endProcessTimer()
  }
}

async function main() {
  console.log('🚀 Exemplo 4: Métricas e Observabilidade\n')
  
  // Processar vários eventos
  const events = [
    { type: 'user.created', body: { userId: 'u1' } },
    { type: 'user.created', body: { userId: 'u2' } },
    { type: 'payment.processed', body: { amount: 99.99 } },
    { type: 'payment.processed', body: { amount: 199.99 } },
    { type: 'payment.processed', body: { amount: 49.99 } },
    { type: 'email.sent', body: { to: 'user@ex.com' } },
    { type: 'user.created', body: { userId: 'u3' } },
    { type: 'email.sent', body: { to: 'user2@ex.com' } },
  ]
  
  console.log(`📊 Processando ${events.length} eventos...\n`)
  
  for (const event of events) {
    const result = await processEvent(event.type, event.body)
    console.log(`✅ ${event.type} → ${result.spanId}`)
  }
  
  console.log()
  console.log('📈 Métricas coletadas!\n')
  
  // Exportar métricas no formato Prometheus
  const metrics = await register.metrics()
  
  console.log('═══════════════════════════════════════════════════')
  console.log('MÉTRICAS PROMETHEUS')
  console.log('═══════════════════════════════════════════════════')
  console.log(metrics)
  console.log('═══════════════════════════════════════════════════')
  console.log()
  
  // Análise das métricas
  console.log('📊 Análise:')
  console.log()
  
  const metricsObj = register.getMetricsAsJSON()
  
  for (const metric of metricsObj) {
    if (metric.name === 'jsonatomic_spans_created_total') {
      console.log('Spans Criados por Tipo:')
      for (const value of metric.values) {
        console.log(`   ${value.labels.type}: ${value.value}`)
      }
      console.log()
    }
    
    if (metric.name === 'jsonatomic_sign_duration_seconds') {
      const values = metric.values as any[]
      const count = values.find(v => v.metricName?.endsWith('_count'))?.value || 0
      const sum = values.find(v => v.metricName?.endsWith('_sum'))?.value || 0
      const avg = count > 0 ? (sum / count * 1000).toFixed(2) : 0
      
      console.log('Latência de Assinatura:')
      console.log(`   Total: ${count} assinaturas`)
      console.log(`   Média: ${avg}ms`)
      console.log()
    }
  }
  
  console.log('💡 Em produção:')
  console.log('   - Exponha endpoint /metrics para Prometheus')
  console.log('   - Configure alertas (ex: latência > 100ms)')
  console.log('   - Crie dashboards no Grafana')
  console.log('   - Monitore taxa de erros')
  console.log()
  console.log('🔗 Exemplo de servidor de métricas:')
  console.log('   import express from "express"')
  console.log('   const app = express()')
  console.log('   app.get("/metrics", async (req, res) => {')
  console.log('     res.set("Content-Type", register.contentType)')
  console.log('     res.end(await register.metrics())')
  console.log('   })')
  console.log('   app.listen(9090)')
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
