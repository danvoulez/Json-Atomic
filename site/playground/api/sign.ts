import type { NextApiRequest, NextApiResponse } from "next"
import { signAtomic } from "../../../core/crypto.ts"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { atomic } = req.body
  try {
    const result = await signAtomic(atomic, process.env.SIGNING_KEY_HEX)
    res.status(200).json({ signed: result })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}