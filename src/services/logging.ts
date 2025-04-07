import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export class LoggingService {
  private s3Client: S3Client;
  private server: Server;
  private bucketName: string;
  private logBuffer: any[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(server: Server, bucketName: string, region: string = "us-east-1") {
    this.server = server;
    this.bucketName = bucketName;
    this.s3Client = new S3Client({ region });

    // Flush logs every 5 minutes or when buffer reaches 100 entries
    this.flushInterval = setInterval(() => this.flushLogs(), 5 * 60 * 1000);
  }

  async log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };

    // Send to MCP client
    this.server.sendLoggingMessage({
      level: level as any,
      message: message,
      data: data
    });

    // Add to buffer for S3
    this.logBuffer.push(logEntry);

    // Flush if buffer is getting large
    if (this.logBuffer.length >= 100) {
      await this.flushLogs();
    }
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return;

    try {
      const logString = this.logBuffer
        .map(entry => JSON.stringify(entry))
        .join("\n");

      const date = new Date();
      const key = `logs/${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getTime()}.json`;

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: logString,
        ContentType: "application/json"
      }));

      // Clear buffer after successful upload
      this.logBuffer = [];
    } catch (error) {
      console.error("Failed to upload logs to S3:", error);
      // Keep logs in buffer to retry next time
    }
  }

  async cleanup() {
    clearInterval(this.flushInterval);
    await this.flushLogs(); // Final flush
  }
} 