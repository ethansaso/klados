import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { s3Env } from "./env";
import type { StorageAdapter, UploadArgs } from "./storage";

export class S3Storage implements StorageAdapter {
  private client: S3Client;
  private bucketName: string;
  private publicBaseUrl: string;

  constructor() {
    this.client = new S3Client({
      region: s3Env.AWS_REGION,
      endpoint: s3Env.S3_ENDPOINT,
      credentials: {
        accessKeyId: s3Env.AWS_ACCESS_KEY_ID,
        secretAccessKey: s3Env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = s3Env.S3_BUCKET_NAME;
    this.publicBaseUrl = s3Env.S3_PUBLIC_BASE_URL;
  }
  async upload({
    key,
    body,
    contentType,
  }: UploadArgs): Promise<{ url: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return { url: this.getUrl(key) };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  getUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
