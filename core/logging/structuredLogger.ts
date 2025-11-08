/**
 * 7. Logging estruturado NDJSON, opcional envio a sink externo
 */
export class StructuredLogger {
  private outStream: Deno.FsFile | null = null
  private sinkUrl?: string

  constructor(path?: string, sinkUrl?: string) {
    this.sinkUrl = sinkUrl
    if (path) {
      this.outStream = Deno.openSync(path, { write: true, create: true, append: true })
    }
  }

  log(obj: any) {
    const line = JSON.stringify(obj) + "\n"
    if (this.outStream) {
      this.outStream.writeSync(new TextEncoder().encode(line))
    }
    if (this.sinkUrl) {
      // Envia para HTTP Sink externo
      fetch(this.sinkUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-ndjson" },
        body: line
      })
    }
  }
}

/*
Uso: const logger = new StructuredLogger("./logs/app.ndjson");
logger.log({ event: "span_appended", atomic });
*/