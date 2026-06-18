"use node";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { requireModelTestAdminPassword } from "./modelTestAuth";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function getR2Env() {
  const endpoint = process.env.R2_S3_URL;
  const accessKeyId = process.env.R2_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_S3_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_S3_BUCKET_NAME;
  const publicUrl = process.env.R2_URL;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("R2 upload environment is not configured.");
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function getClient() {
  const env = getR2Env();

  return new S3Client({
    region: "auto",
    endpoint: env.endpoint,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "model-test-shot.png";
}

function normalizeMimeType(mimeType: string) {
  const normalized = mimeType.trim().toLowerCase();
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
}

function estimateBase64Bytes(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function detectImageMimeType(bytes: Buffer) {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    bytes.length >= 6 &&
    (bytes.toString("ascii", 0, 6) === "GIF87a" ||
      bytes.toString("ascii", 0, 6) === "GIF89a")
  ) {
    return "image/gif";
  }

  return null;
}

function assertObjectKey(objectKey: string) {
  if (!objectKey.startsWith("model-tests/") || objectKey.includes("..")) {
    throw new Error("Invalid model-test object key.");
  }
}

async function deleteObjectKeys(objectKeys: Array<string | undefined>) {
  const keys = Array.from(
    new Set(
      objectKeys.filter((objectKey): objectKey is string =>
        Boolean(objectKey),
      ),
    ),
  );
  if (keys.length === 0) return;

  const env = getR2Env();
  const client = getClient();
  await Promise.all(
    keys.map(async (objectKey) => {
      assertObjectKey(objectKey);
      await client.send(
        new DeleteObjectCommand({
          Bucket: env.bucket,
          Key: objectKey,
        }),
      );
    }),
  );
}

export const uploadResultImage = action({
  args: {
    adminPassword: v.string(),
    base64: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);

    const mimeType = normalizeMimeType(args.mimeType);
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      throw new Error("Only PNG, JPEG, WebP, or GIF images are allowed.");
    }

    const base64 = args.base64.replace(/\s/g, "");
    if (estimateBase64Bytes(base64) > MAX_IMAGE_BYTES) {
      throw new Error("Image is too large. Maximum size is 4 MB.");
    }

    const bytes = Buffer.from(base64, "base64");
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("Image is too large. Maximum size is 4 MB.");
    }
    if (detectImageMimeType(bytes) !== mimeType) {
      throw new Error("Image content does not match the selected file type.");
    }

    const env = getR2Env();
    const fileName = sanitizeFileName(args.fileName);
    const objectKey = `model-tests/uploads/${Date.now()}-${randomUUID()}-${fileName}`;

    await getClient().send(
      new PutObjectCommand({
        Bucket: env.bucket,
        Key: objectKey,
        Body: bytes,
        ContentType: mimeType,
      }),
    );

    return {
      url: `${env.publicUrl.replace(/\/+$/, "")}/${objectKey}`,
      objectKey,
      fileName,
      mimeType,
      size: bytes.byteLength,
    };
  },
});

export const deleteUploadedImage = action({
  args: {
    adminPassword: v.string(),
    objectKey: v.string(),
  },
  handler: async (_ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    await deleteObjectKeys([args.objectKey]);
  },
});

export const removeResultImage = action({
  args: {
    adminPassword: v.string(),
    attachmentId: v.id("modelTestAttachments"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const target = await ctx.runQuery(api.modelTests.getAttachmentDeleteTarget, args);
    if (!target) return;
    await deleteObjectKeys([target.objectKey]);
    await ctx.runMutation(api.modelTests.removeAttachment, args);
  },
});

export const deleteResultWithImages = action({
  args: {
    adminPassword: v.string(),
    resultId: v.id("modelTestResults"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const targets = await ctx.runQuery(
      api.modelTests.listAttachmentDeleteTargetsForResult,
      args,
    );
    await deleteObjectKeys(targets.map((target) => target.objectKey));
    await ctx.runMutation(api.modelTests.deleteResult, args);
  },
});

export const deleteChallengeWithImages = action({
  args: {
    adminPassword: v.string(),
    challengeId: v.id("modelTestChallenges"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const targets = await ctx.runQuery(
      api.modelTests.listAttachmentDeleteTargetsForChallenge,
      args,
    );
    await deleteObjectKeys(targets.map((target) => target.objectKey));
    await ctx.runMutation(api.modelTests.deleteChallenge, args);
  },
});

export const deleteSuiteWithImages = action({
  args: {
    adminPassword: v.string(),
    suiteId: v.id("modelTestSuites"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const targets = await ctx.runQuery(
      api.modelTests.listAttachmentDeleteTargetsForSuite,
      args,
    );
    await deleteObjectKeys(targets.map((target) => target.objectKey));
    await ctx.runMutation(api.modelTests.deleteSuite, args);
  },
});

export const deleteModelWithImages = action({
  args: {
    adminPassword: v.string(),
    modelId: v.id("modelTestModels"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const targets = await ctx.runQuery(
      api.modelTests.listAttachmentDeleteTargetsForModel,
      args,
    );
    await deleteObjectKeys(targets.map((target) => target.objectKey));
    await ctx.runMutation(api.modelTests.deleteModel, args);
  },
});
