/**
 * 6. Cross-signing entre múltiplos nodes (ledger federado)
 */
import { ed25519 } from "@noble/curves/ed25519"

export class CrossSignManager {
  private networkKeys: Set<string> = new Set()

  registerNode(pubKeyHex: string) {
    this.networkKeys.add(pubKeyHex)
  }

  verifyAny(data: string, signatureHex: string): boolean {
    const sig = Uint8Array.from(Buffer.from(signatureHex, "hex"))
    for (const pk of this.networkKeys) {
      const pubKey = Uint8Array.from(Buffer.from(pk, "hex"))
      if (ed25519.verify(sig, new TextEncoder().encode(data), pubKey)) {
        return true
      }
    }
    return false
  }
}