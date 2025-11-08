/**
 * 20. Storage Backend S3/MinIO
 * Suporte opcional a persistência em S3/MinIO para volumes altos.
 * Requer Deno.env: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
 * Usa https://deno.land/x/s3/mod.ts (AWS S3 compatível)
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from "npm:@aws-sdk/client-s3"

export class S3StorageBackend {
  private s3: S3Client
  private bucket: string

  constructor() {
    this.s3 = new S3Client({
      region: "us-east-1",
      endpoint: Deno.env.get("S3_ENDPOINT"),
      credentials: {
        accessKeyId: Deno.env.get("S3_ACCESS_KEY")!,
        secretAccessKey: Deno.env.get("S3_SECRET_KEY")!
      }
    })
    this.bucket = Deno.env.get("S3_BUCKET") || "logline"
  }

  async put(key: string, content: string | Uint8Array) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: typeof content === "string" ? new TextEncoder().encode(content) : content
      })
    )
  }

  async get(key: string): Promise<Uint8Array> {
    const resp = await this.s3.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    }))
    // Response Body é um stream
    return new Uint8Array(await resp.Body.transformToByteArray())
  }
}