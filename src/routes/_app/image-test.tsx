import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { storage } from "../../lib/storage";

const uploadTestImageFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      base64: z.string(),
      contentType: z.string(),
      ext: z.string().regex(/^\w+$/),
    }),
  )
  .handler(async ({ data }) => {
    const key = `test/${uuidv4()}.${data.ext}`;
    const body = Buffer.from(data.base64, "base64");
    const { url } = await storage.upload({
      key,
      body,
      contentType: data.contentType,
    });
    return { url };
  });

export const Route = createFileRoute("/_app/image-test")({
  component: RouteComponent,
});

function RouteComponent() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUrl(null);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);
      const ext = file.name.split(".").pop() ?? "bin";

      const result = await uploadTestImageFn({
        data: { base64, contentType: file.type, ext },
      });

      setUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Storage upload test</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={loading}
      />
      {loading && <p>Uploading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {url && (
        <div>
          <p>
            Uploaded URL: <code>{url}</code>
          </p>
          <img
            src={url}
            alt="uploaded"
            style={{ maxWidth: 400, marginTop: 8 }}
          />
        </div>
      )}
    </div>
  );
}
