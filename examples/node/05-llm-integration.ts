/**
 * Exemplo 5: Integração com LLM
 * 
 * Este exemplo demonstra:
 * 1. Como criar spans para interações com LLMs
 * 2. Rastrear prompts e respostas
 * 3. Manter trilha auditável de conversas AI
 */

import { createSpan, signSpan, verifySpan } from '../../index'
import * as dotenv from 'dotenv'

dotenv.config()

const domain = 'llm-integration'
const privateKey = process.env.PRIVATE_KEY
const publicKey = process.env.PUBLIC_KEY

if (!privateKey || !publicKey) {
  console.error('❌ Chaves não configuradas!')
  process.exit(1)
}

// Simular chamada para LLM (em produção, usar OpenAI, Anthropic, etc.)
async function callLLM(prompt: string): Promise<string> {
  // Simular latência
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Resposta simulada
  return `Resposta gerada para: "${prompt.substring(0, 50)}..."`
}

/**
 * Wrapper que cria span para cada interação com LLM
 */
async function llmWithSpan(
  prompt: string,
  metadata: { userId: string; sessionId: string; traceId: string }
) {
  const startTime = Date.now()
  
  try {
    // 1. Criar span para o PROMPT
    const promptSpan = createSpan({
      type: 'llm.prompt',
      body: {
        prompt,
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.7
      },
      meta: {
        ...metadata,
        timestamp: startTime,
        direction: 'request'
      }
    })
    
    const signedPrompt = await signSpan(promptSpan, { domain, privateKey })
    console.log(`📤 Prompt enviado (span: ${signedPrompt.id})`)
    
    // 2. Chamar LLM
    const response = await callLLM(prompt)
    const endTime = Date.now()
    const latency = endTime - startTime
    
    // 3. Criar span para a RESPOSTA
    const responseSpan = createSpan({
      type: 'llm.response',
      body: {
        response,
        tokensUsed: 150,
        finishReason: 'stop'
      },
      meta: {
        ...metadata,
        timestamp: endTime,
        direction: 'response',
        latencyMs: latency,
        parentId: signedPrompt.id  // Vincula ao prompt
      }
    })
    
    const signedResponse = await signSpan(responseSpan, { domain, privateKey })
    console.log(`📥 Resposta recebida (span: ${signedResponse.id})`)
    console.log(`   Latência: ${latency}ms`)
    
    return {
      response,
      spans: {
        prompt: signedPrompt,
        response: signedResponse
      }
    }
    
  } catch (err) {
    // 4. Criar span para ERRO
    const errorSpan = createSpan({
      type: 'llm.error',
      body: {
        error: err.message,
        code: err.code || 'UNKNOWN'
      },
      meta: {
        ...metadata,
        timestamp: Date.now()
      }
    })
    
    const signedError = await signSpan(errorSpan, { domain, privateKey })
    console.error(`❌ Erro (span: ${signedError.id})`)
    
    throw err
  }
}

async function main() {
  console.log('🚀 Exemplo 5: Integração com LLM\n')
  
  const userId = 'user_123'
  const sessionId = 'session_' + Date.now()
  const traceId = 'trace_' + Date.now()
  
  console.log('🤖 Simulando conversa com LLM...\n')
  
  // Interação 1
  console.log('─────────────────────────────────────────')
  console.log('User: O que é JSON✯Atomic?')
  const result1 = await llmWithSpan(
    'O que é JSON✯Atomic?',
    { userId, sessionId, traceId }
  )
  console.log(`AI: ${result1.response}`)
  console.log()
  
  // Interação 2
  console.log('─────────────────────────────────────────')
  console.log('User: Como funciona a assinatura Ed25519?')
  const result2 = await llmWithSpan(
    'Como funciona a assinatura Ed25519?',
    { userId, sessionId, traceId }
  )
  console.log(`AI: ${result2.response}`)
  console.log()
  
  // Interação 3
  console.log('─────────────────────────────────────────')
  console.log('User: Quais são os casos de uso principais?')
  const result3 = await llmWithSpan(
    'Quais são os casos de uso principais?',
    { userId, sessionId, traceId }
  )
  console.log(`AI: ${result3.response}`)
  console.log()
  
  console.log('═════════════════════════════════════════')
  console.log('✅ Conversa completa rastreada!\n')
  
  // Verificar integridade de todos os spans
  console.log('🔍 Verificando integridade dos spans...\n')
  
  const allSpans = [
    result1.spans.prompt,
    result1.spans.response,
    result2.spans.prompt,
    result2.spans.response,
    result3.spans.prompt,
    result3.spans.response
  ]
  
  for (const span of allSpans) {
    const valid = await verifySpan(span, { domain, publicKey })
    const status = valid ? '✅' : '❌'
    console.log(`${status} ${span.type} (${span.id})`)
  }
  
  console.log()
  console.log('📊 Resumo da Sessão:')
  console.log(`   Session ID: ${sessionId}`)
  console.log(`   Trace ID: ${traceId}`)
  console.log(`   Total de interações: 3`)
  console.log(`   Total de spans: ${allSpans.length}`)
  console.log()
  
  console.log('💡 Benefícios do rastreamento:')
  console.log('   ✅ Auditoria completa de interações com AI')
  console.log('   ✅ Debugging facilitado (trace IDs)')
  console.log('   ✅ Compliance (GDPR, SOC2, etc.)')
  console.log('   ✅ Análise de custos (tokens por usuário)')
  console.log('   ✅ Detecção de abusos')
  console.log('   ✅ Prova de que prompts não foram alterados')
  console.log()
  
  console.log('🔗 Use cases adicionais:')
  console.log('   - RAG (Retrieval-Augmented Generation) com spans')
  console.log('   - Chain-of-thought tracking')
  console.log('   - Multi-agent orchestration')
  console.log('   - Fine-tuning dataset generation')
  console.log('   - Cost optimization analytics')
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
