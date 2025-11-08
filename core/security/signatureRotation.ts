/**
 * 14. Signature Rotation
 * Suporte a múltiplas chaves públicas para rotação segura de identidade do assinante.
 */
import { ed25519 } from "@noble/curves/ed25519"

export class SignatureRotationManager {
  private publicKeys: Set<string> = new Set()

  addKey(hex: string) {
    this.publicKeys.add(hex)
  }
  removeKey(hex: string) {
    this.publicKeys.delete(hex)
  }
  verify(data: string, signatureHex: string): boolean {
    const sig = Uint8Array.from(Buffer.from(signatureHex, "hex"))
    for (const pk of this.publicKeys) {
      const pubKey = Uint8Array.from(Buffer.from(pk, "hex"))
      if (ed25519.verify(sig, new TextEncoder().encode(data), pubKey)) {
        return true
      }
    }
    return false
  }

  listKeys(): string[] {
    return Array.from(this.publicKeys)
  }
}