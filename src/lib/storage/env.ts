import { z } from "zod";

export const storageEnv = z
  .object({
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  })
  .parse(process.env);

/** Will throw if STORAGE_DRIVER is "s3" and the S3 environment variables are not set */
export const s3Env =
  storageEnv.STORAGE_DRIVER === "s3"
    ? z
        .object({
          AWS_REGION: z.string().min(1),
          AWS_ACCESS_KEY_ID: z.string().min(1),
          AWS_SECRET_ACCESS_KEY: z.string().min(1),
          S3_BUCKET_NAME: z.string().min(1),
          /**
           * Endpoint for S3-compatible providers (Cloudflare R2, MinIO, ...).
           * Leave unset to use AWS S3's default endpoint for the region.
           */
          S3_ENDPOINT: z.url().optional(),
          /**
           * Public base URL objects are served from, e.g.
           * https://media.klados.bio. Strips trailing slashes.
           */
          S3_PUBLIC_BASE_URL: z
            .url()
            .transform((url) => url.replace(/\/+$/, "")),
        })
        .parse(process.env)
    : (null as never);
