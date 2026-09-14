import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { head, issueSignedToken, presignUrl } from "@vercel/blob";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const s3Remote = () => Boolean(process.env.S3_BUCKET);
const blobRemote = () =>
  Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

const client = () =>
  new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });

const safeName = (value = "file") =>
  value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-140) || "file";
const blobPath = (e) => `evidence/${e.caseId}/${e.id}-${safeName(e.name)}`;

export const storageConfigured = () => s3Remote() || blobRemote();
export const localPath = (id) => path.resolve(".local/evidence", id);

async function blobSignedUrl(e, operation, expiresMs) {
  const pathname = blobPath(e);
  const validUntil = Date.now() + expiresMs;
  const signedToken = await issueSignedToken({
    pathname,
    operations: [operation],
    validUntil,
    ...(operation === "put"
      ? {
          allowedContentTypes: [e.type],
          maximumSizeInBytes: e.size,
        }
      : {}),
  });
  const { presignedUrl } = await presignUrl(signedToken, {
    pathname,
    operation,
    access: "private",
    validUntil,
    ...(operation === "put"
      ? {
          allowedContentTypes: [e.type],
          maximumSizeInBytes: e.size,
          addRandomSuffix: false,
          allowOverwrite: true,
        }
      : { useCache: false }),
  });
  return presignedUrl;
}

export async function uploadURL(e) {
  if (blobRemote()) return blobSignedUrl(e, "put", 15 * 60 * 1000);
  if (s3Remote())
    return getSignedUrl(
      client(),
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: e.id,
        ContentType: e.type,
      }),
      { expiresIn: 900 },
    );
  if (process.env.VERCEL)
    throw Object.assign(
      new Error("Armazenamento de evidências não configurado."),
      { status: 503 },
    );
  await mkdir(".local/evidence", { recursive: true });
  return "/api/uploads/" + e.id;
}

export async function downloadURL(e) {
  if (blobRemote()) return blobSignedUrl(e, "get", 2 * 60 * 1000);
  if (s3Remote())
    return getSignedUrl(
      client(),
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: e.id,
        ResponseContentDisposition: `attachment; filename="${safeName(e.name)}"`,
      }),
      { expiresIn: 120 },
    );
  return null;
}

export async function verifyUpload(e) {
  let size;
  if (blobRemote()) {
    const metadata = await head(blobPath(e));
    size = metadata.size;
  } else if (s3Remote()) {
    size = (
      await client().send(
        new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: e.id }),
      )
    ).ContentLength;
  } else {
    size = (await stat(localPath(e.id))).size;
  }
  if (size !== e.size)
    throw Object.assign(
      new Error("Tamanho do arquivo recebido não corresponde ao informado."),
      { status: 400 },
    );
}
