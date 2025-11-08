import type { NextApiRequest, NextApiResponse } from "next"
import { CodeExecutor } from "../../../core/execution/executor.ts"

const executor = new CodeExecutor()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { atomic } = req.body
  try {
    const result = await executor.execute(atomic)
    res.status(200).json({ result })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}