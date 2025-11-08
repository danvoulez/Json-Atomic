/**
 * 26. Playground Interativo (React, Next.js ou Vite)
 * UI textarea para montar spans, simular execução, assinar e visualizar resposta.
 */

import React, { useState } from "react"

export default function Playground() {
  const [input, setInput] = useState<string>("")
  const [response, setResponse] = useState<any>(null)
  const [mode, setMode] = useState<"canonicalize" | "sign" | "execute">("canonicalize")
  const [error, setError] = useState<string>("")

  async function run() {
    setError("")
    try {
      const atomic = JSON.parse(input)
      if (mode === "canonicalize") {
        const res = await fetch("/api/canonicalize", { method: "POST", body: JSON.stringify({ atomic }) })
        setResponse(await res.json())
      }
      else if (mode === "sign") {
        const res = await fetch("/api/sign", { method: "POST", body: JSON.stringify({ atomic }) })
        setResponse(await res.json())
      }
      else if (mode === "execute") {
        const res = await fetch("/api/execute", { method: "POST", body: JSON.stringify({ atomic }) })
        setResponse(await res.json())
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h2>LogLine Playground</h2>
      <select value={mode} onChange={e => setMode(e.target.value as any)}>
        <option value="canonicalize">Canonicalizar</option>
        <option value="sign">Assinar</option>
        <option value="execute">Executar (simulado)</option>
      </select>
      <br />
      <textarea rows={12} cols={80} value={input} onChange={e => setInput(e.target.value)} placeholder="Cole um atomic JSON aqui..." />
      <br />
      <button onClick={run}>Executar</button>
      {error && <div style={{color:"red"}}>Erro: {error}</div>}
      {response && (
        <pre style={{background:"#eef"}}>{JSON.stringify(response, null, 2)}</pre>
      )}
    </div>
  )
}