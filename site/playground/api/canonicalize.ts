import type { NextApiRequest, NextApiResponse } from "next"
import { canonicalize } from "../../../core/canonical.ts"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { atomic } = req.body
  try {
    const result = canonicalize(atomic)
    res.status(200).json({ canonical: result })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}