import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireModelTestAdminPassword } from "./modelTestAuth";

const MAX_MODELS = 100;
const MAX_SUITES = 50;
const MAX_LINKS = 500;
const MAX_CHALLENGES = 500;
const MAX_RESULTS = 1000;
const MAX_ATTACHMENTS = 1000;

const suiteStatusValidator = v.union(
  v.literal("draft"),
  v.literal("running"),
  v.literal("complete"),
);

const optionalTextValidator = v.optional(v.string());

function now() {
  return Date.now();
}

function cleanText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function cleanList(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function assertRating(name: string, value: number | undefined) {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${name} must be an integer from 1 to 5.`);
  }
}

function assertNonNegative(name: string, value: number | undefined) {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be zero or greater.`);
  }
}

function assertPositiveInteger(name: string, value: number | undefined) {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

export const publicConfig = query({
  args: {},
  handler: async () => ({
    passwordConfigured: Boolean(process.env.MODEL_TEST_ADMIN_PASSWORD),
    uploadsConfigured: Boolean(
      process.env.R2_S3_URL &&
        process.env.R2_S3_ACCESS_KEY_ID &&
        process.env.R2_S3_SECRET_ACCESS_KEY &&
        process.env.R2_S3_BUCKET_NAME &&
        process.env.R2_URL,
    ),
  }),
});

export const verifyAdminPassword = mutation({
  args: {
    adminPassword: v.string(),
  },
  handler: async (_ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    return true;
  },
});

export const listWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db
      .query("modelTestModels")
      .withIndex("by_createdAt")
      .order("asc")
      .take(MAX_MODELS);
    const suites = await ctx.db
      .query("modelTestSuites")
      .withIndex("by_createdAt")
      .order("desc")
      .take(MAX_SUITES);
    const suiteModels = await ctx.db
      .query("modelTestSuiteModels")
      .take(MAX_LINKS);
    const challenges = await ctx.db
      .query("modelTestChallenges")
      .take(MAX_CHALLENGES);
    const results = await ctx.db.query("modelTestResults").take(MAX_RESULTS);
    const attachments = await ctx.db
      .query("modelTestAttachments")
      .take(MAX_ATTACHMENTS);

    return { models, suites, suiteModels, challenges, results, attachments };
  },
});

export const createModel = mutation({
  args: {
    adminPassword: v.string(),
    name: v.string(),
    provider: optionalTextValidator,
    notes: optionalTextValidator,
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const timestamp = now();

    return await ctx.db.insert("modelTestModels", {
      name: args.name.trim(),
      provider: cleanText(args.provider),
      notes: cleanText(args.notes),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const updateModel = mutation({
  args: {
    adminPassword: v.string(),
    modelId: v.id("modelTestModels"),
    name: optionalTextValidator,
    provider: optionalTextValidator,
    notes: optionalTextValidator,
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    await ctx.db.patch(args.modelId, {
      ...(args.name !== undefined ? { name: args.name.trim() } : {}),
      ...(args.provider !== undefined
        ? { provider: cleanText(args.provider) }
        : {}),
      ...(args.notes !== undefined ? { notes: cleanText(args.notes) } : {}),
      updatedAt: now(),
    });
  },
});

export const deleteModel = mutation({
  args: {
    adminPassword: v.string(),
    modelId: v.id("modelTestModels"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const links = await ctx.db
      .query("modelTestSuiteModels")
      .withIndex("by_model", (q) => q.eq("modelId", args.modelId))
      .take(MAX_LINKS);
    const results = await ctx.db
      .query("modelTestResults")
      .withIndex("by_model", (q) => q.eq("modelId", args.modelId))
      .take(MAX_RESULTS);
    const attachments = await ctx.db
      .query("modelTestAttachments")
      .withIndex("by_model", (q) => q.eq("modelId", args.modelId))
      .take(MAX_ATTACHMENTS);

    for (const attachment of attachments) await ctx.db.delete(attachment._id);
    for (const result of results) await ctx.db.delete(result._id);
    for (const link of links) await ctx.db.delete(link._id);
    await ctx.db.delete(args.modelId);
  },
});

export const createSuite = mutation({
  args: {
    adminPassword: v.string(),
    title: v.string(),
    description: optionalTextValidator,
    status: v.optional(suiteStatusValidator),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const timestamp = now();

    return await ctx.db.insert("modelTestSuites", {
      title: args.title.trim(),
      description: cleanText(args.description),
      status: args.status ?? "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const updateSuite = mutation({
  args: {
    adminPassword: v.string(),
    suiteId: v.id("modelTestSuites"),
    title: optionalTextValidator,
    description: optionalTextValidator,
    status: v.optional(suiteStatusValidator),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    await ctx.db.patch(args.suiteId, {
      ...(args.title !== undefined ? { title: args.title.trim() } : {}),
      ...(args.description !== undefined
        ? { description: cleanText(args.description) }
        : {}),
      ...(args.status !== undefined ? { status: args.status } : {}),
      updatedAt: now(),
    });
  },
});

export const deleteSuite = mutation({
  args: {
    adminPassword: v.string(),
    suiteId: v.id("modelTestSuites"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const links = await ctx.db
      .query("modelTestSuiteModels")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .take(MAX_LINKS);
    const challenges = await ctx.db
      .query("modelTestChallenges")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .take(MAX_CHALLENGES);
    const results = await ctx.db
      .query("modelTestResults")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .take(MAX_RESULTS);
    const attachments = await ctx.db
      .query("modelTestAttachments")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .take(MAX_ATTACHMENTS);

    for (const attachment of attachments) await ctx.db.delete(attachment._id);
    for (const result of results) await ctx.db.delete(result._id);
    for (const challenge of challenges) await ctx.db.delete(challenge._id);
    for (const link of links) await ctx.db.delete(link._id);
    await ctx.db.delete(args.suiteId);
  },
});

export const setSuiteModels = mutation({
  args: {
    adminPassword: v.string(),
    suiteId: v.id("modelTestSuites"),
    modelIds: v.array(v.id("modelTestModels")),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const existing = await ctx.db
      .query("modelTestSuiteModels")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .take(MAX_LINKS);
    const uniqueModelIds = Array.from(new Set(args.modelIds));
    const timestamp = now();

    for (const link of existing) await ctx.db.delete(link._id);
    for (const [order, modelId] of uniqueModelIds.entries()) {
      await ctx.db.insert("modelTestSuiteModels", {
        suiteId: args.suiteId,
        modelId,
        order,
        createdAt: timestamp,
      });
    }

    await ctx.db.patch(args.suiteId, { updatedAt: timestamp });
  },
});

export const createChallenge = mutation({
  args: {
    adminPassword: v.string(),
    suiteId: v.id("modelTestSuites"),
    title: v.string(),
    promptText: optionalTextValidator,
    expectedOutcome: optionalTextValidator,
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const existing = await ctx.db
      .query("modelTestChallenges")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .take(MAX_CHALLENGES);
    const timestamp = now();

    return await ctx.db.insert("modelTestChallenges", {
      suiteId: args.suiteId,
      title: args.title.trim(),
      promptText: cleanText(args.promptText),
      expectedOutcome: cleanText(args.expectedOutcome),
      order: existing.length,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const updateChallenge = mutation({
  args: {
    adminPassword: v.string(),
    challengeId: v.id("modelTestChallenges"),
    title: optionalTextValidator,
    promptText: optionalTextValidator,
    expectedOutcome: optionalTextValidator,
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    await ctx.db.patch(args.challengeId, {
      ...(args.title !== undefined ? { title: args.title.trim() } : {}),
      ...(args.promptText !== undefined
        ? { promptText: cleanText(args.promptText) }
        : {}),
      ...(args.expectedOutcome !== undefined
        ? { expectedOutcome: cleanText(args.expectedOutcome) }
        : {}),
      ...(args.order !== undefined ? { order: args.order } : {}),
      updatedAt: now(),
    });
  },
});

export const deleteChallenge = mutation({
  args: {
    adminPassword: v.string(),
    challengeId: v.id("modelTestChallenges"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const challenge = await ctx.db.get(args.challengeId);
    const results = await ctx.db
      .query("modelTestResults")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .take(MAX_RESULTS);
    const attachments = await ctx.db
      .query("modelTestAttachments")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", args.challengeId),
      )
      .take(MAX_ATTACHMENTS);

    for (const attachment of attachments) await ctx.db.delete(attachment._id);
    for (const result of results) await ctx.db.delete(result._id);
    await ctx.db.delete(args.challengeId);
    if (challenge) await ctx.db.patch(challenge.suiteId, { updatedAt: now() });
  },
});

export const upsertResult = mutation({
  args: {
    adminPassword: v.string(),
    suiteId: v.id("modelTestSuites"),
    challengeId: v.id("modelTestChallenges"),
    modelId: v.id("modelTestModels"),
    durationSeconds: v.optional(v.number()),
    shots: v.optional(v.number()),
    codeQuality: v.optional(v.number()),
    featureCoverage: v.optional(v.number()),
    reliability: v.optional(v.number()),
    notes: optionalTextValidator,
    positives: v.array(v.string()),
    negatives: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    assertNonNegative("Duration", args.durationSeconds);
    assertPositiveInteger("Shots", args.shots);
    assertRating("Code quality", args.codeQuality);
    assertRating("Feature coverage", args.featureCoverage);
    assertRating("Reliability", args.reliability);

    const suite = await ctx.db.get(args.suiteId);
    const challenge = await ctx.db.get(args.challengeId);
    const model = await ctx.db.get(args.modelId);
    const suiteModel = await ctx.db
      .query("modelTestSuiteModels")
      .withIndex("by_suite_and_model", (q) =>
        q.eq("suiteId", args.suiteId).eq("modelId", args.modelId),
      )
      .unique();

    if (!suite) throw new Error("Suite not found.");
    if (!challenge) throw new Error("Challenge not found.");
    if (!model) throw new Error("Model not found.");
    if (challenge.suiteId !== args.suiteId) {
      throw new Error("Challenge does not belong to this suite.");
    }
    if (!suiteModel) {
      throw new Error("Model is not selected for this suite.");
    }

    const timestamp = now();
    const existing = await ctx.db
      .query("modelTestResults")
      .withIndex("by_challenge_and_model", (q) =>
        q.eq("challengeId", args.challengeId).eq("modelId", args.modelId),
      )
      .unique();
    const patch = {
      suiteId: args.suiteId,
      challengeId: args.challengeId,
      modelId: args.modelId,
      durationSeconds: args.durationSeconds,
      shots: args.shots,
      codeQuality: args.codeQuality,
      featureCoverage: args.featureCoverage,
      reliability: args.reliability,
      notes: cleanText(args.notes),
      positives: cleanList(args.positives),
      negatives: cleanList(args.negatives),
      updatedAt: timestamp,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("modelTestResults", {
      ...patch,
      createdAt: timestamp,
    });
  },
});

export const deleteResult = mutation({
  args: {
    adminPassword: v.string(),
    resultId: v.id("modelTestResults"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const attachments = await ctx.db
      .query("modelTestAttachments")
      .withIndex("by_result", (q) => q.eq("resultId", args.resultId))
      .take(MAX_ATTACHMENTS);

    for (const attachment of attachments) await ctx.db.delete(attachment._id);
    await ctx.db.delete(args.resultId);
  },
});

export const addAttachment = mutation({
  args: {
    adminPassword: v.string(),
    resultId: v.id("modelTestResults"),
    url: v.string(),
    objectKey: v.optional(v.string()),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Result not found.");

    return await ctx.db.insert("modelTestAttachments", {
      resultId: args.resultId,
      suiteId: result.suiteId,
      challengeId: result.challengeId,
      modelId: result.modelId,
      url: args.url,
      objectKey: args.objectKey,
      fileName: args.fileName.trim(),
      mimeType: args.mimeType,
      size: args.size,
      createdAt: now(),
    });
  },
});

export const removeAttachment = mutation({
  args: {
    adminPassword: v.string(),
    attachmentId: v.id("modelTestAttachments"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    await ctx.db.delete(args.attachmentId);
  },
});

export const getAttachmentDeleteTarget = query({
  args: {
    adminPassword: v.string(),
    attachmentId: v.id("modelTestAttachments"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) return null;
    return {
      objectKey: attachment.objectKey,
    };
  },
});

export const listAttachmentDeleteTargetsForModel = query({
  args: {
    adminPassword: v.string(),
    modelId: v.id("modelTestModels"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const attachments = await ctx.db
      .query("modelTestAttachments")
      .withIndex("by_model", (q) => q.eq("modelId", args.modelId))
      .take(MAX_ATTACHMENTS);
    return attachments.map((attachment) => ({
      objectKey: attachment.objectKey,
    }));
  },
});

export const listAttachmentDeleteTargetsForSuite = query({
  args: {
    adminPassword: v.string(),
    suiteId: v.id("modelTestSuites"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const attachments = await ctx.db
      .query("modelTestAttachments")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .take(MAX_ATTACHMENTS);
    return attachments.map((attachment) => ({
      objectKey: attachment.objectKey,
    }));
  },
});

export const listAttachmentDeleteTargetsForChallenge = query({
  args: {
    adminPassword: v.string(),
    challengeId: v.id("modelTestChallenges"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const attachments = await ctx.db
      .query("modelTestAttachments")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", args.challengeId),
      )
      .take(MAX_ATTACHMENTS);
    return attachments.map((attachment) => ({
      objectKey: attachment.objectKey,
    }));
  },
});

export const listAttachmentDeleteTargetsForResult = query({
  args: {
    adminPassword: v.string(),
    resultId: v.id("modelTestResults"),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const attachments = await ctx.db
      .query("modelTestAttachments")
      .withIndex("by_result", (q) => q.eq("resultId", args.resultId))
      .take(MAX_ATTACHMENTS);
    return attachments.map((attachment) => ({
      objectKey: attachment.objectKey,
    }));
  },
});

export const seedStarterSuite = mutation({
  args: {
    adminPassword: v.string(),
  },
  handler: async (ctx, args) => {
    requireModelTestAdminPassword(args.adminPassword);
    const timestamp = now();
    const opusId = await ctx.db.insert("modelTestModels", {
      name: "Opus 4.5",
      provider: "Anthropic",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const geminiId = await ctx.db.insert("modelTestModels", {
      name: "Gemini 3",
      provider: "Google",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const suiteId = await ctx.db.insert("modelTestSuites", {
      title: "Opus 4.5 vs Gemini 3",
      description: "Starter comparison suite for coding model evaluations.",
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.insert("modelTestSuiteModels", {
      suiteId,
      modelId: opusId,
      order: 0,
      createdAt: timestamp,
    });
    await ctx.db.insert("modelTestSuiteModels", {
      suiteId,
      modelId: geminiId,
      order: 1,
      createdAt: timestamp,
    });
    await ctx.db.insert("modelTestChallenges", {
      suiteId,
      title: "Feature implementation",
      promptText: "Build the requested feature with clean architecture.",
      expectedOutcome: "The result matches the prompt and remains maintainable.",
      order: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return suiteId;
  },
});

export type ModelTestResultId = Id<"modelTestResults">;
