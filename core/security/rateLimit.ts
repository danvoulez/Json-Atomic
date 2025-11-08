/**
 * 5. Rate limiting por IP na API REST/OAK
 */
import { Middleware } from "https://deno.land/x/oak/mod.ts"

const rateMap = new Map<string, { count: number; ts: number }>()

export const rateLimiter: Middleware = async (ctx, next) => {
  const ip = ctx.request.ip
  const now = Date.now()
  const info = rateMap.get(ip) || { count: 0, ts: now }

  if (now - info.ts > 60000) {
    info.count = 1
    info.ts = now
  } else {
    info.count++
  }

  rateMap.set(ip, info)

  if (info.count > 100) {
    ctx.response.status = 429
    ctx.response.body = { error: "Rate limit exceeded" }
  } else {
    await next()
  }
}

/*
Uso: adicione app.use(rateLimiter) no app REST.
*/