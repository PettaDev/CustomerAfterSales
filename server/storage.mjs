import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
const remote = () => Boolean(process.env.S3_BUCKET);
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
export const localPath = (id) => path.resolve(".local/evidence", id);
export async function uploadURL(e) {
  if (remote())
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
  return remote()
    ? getSignedUrl(
        client(),
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: e.id,
          ResponseContentDisposition: "attachment",
        }),
        { expiresIn: 120 },
      )
    : null;
}
export async function verifyUpload(e) {
  const size = remote()
    ? (
        await client().send(
          new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: e.id }),
        )
      ).ContentLength
    : (await stat(localPath(e.id))).size;
  if (size !== e.size)
    throw Object.assign(
      new Error("Tamanho do arquivo recebido não corresponde ao informado."),
      { status: 400 },
    );
}
