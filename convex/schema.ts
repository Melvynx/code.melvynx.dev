import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  modelTestModels: defineTable({
    name: v.string(),
    provider: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  modelTestSuites: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("running"),
      v.literal("complete"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"]),

  modelTestSuiteModels: defineTable({
    suiteId: v.id("modelTestSuites"),
    modelId: v.id("modelTestModels"),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_suite", ["suiteId"])
    .index("by_model", ["modelId"])
    .index("by_suite_and_model", ["suiteId", "modelId"]),

  modelTestChallenges: defineTable({
    suiteId: v.id("modelTestSuites"),
    title: v.string(),
    promptText: v.optional(v.string()),
    expectedOutcome: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_suite", ["suiteId"])
    .index("by_suite_and_order", ["suiteId", "order"]),

  modelTestResults: defineTable({
    suiteId: v.id("modelTestSuites"),
    challengeId: v.id("modelTestChallenges"),
    modelId: v.id("modelTestModels"),
    durationSeconds: v.optional(v.number()),
    shots: v.optional(v.number()),
    codeQuality: v.optional(v.number()),
    featureCoverage: v.optional(v.number()),
    reliability: v.optional(v.number()),
    notes: v.optional(v.string()),
    positives: v.array(v.string()),
    negatives: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_suite", ["suiteId"])
    .index("by_model", ["modelId"])
    .index("by_challenge", ["challengeId"])
    .index("by_challenge_and_model", ["challengeId", "modelId"])
    .index("by_suite_and_model", ["suiteId", "modelId"]),

  modelTestAttachments: defineTable({
    resultId: v.id("modelTestResults"),
    suiteId: v.id("modelTestSuites"),
    challengeId: v.id("modelTestChallenges"),
    modelId: v.id("modelTestModels"),
    url: v.string(),
    objectKey: v.optional(v.string()),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    createdAt: v.number(),
  })
    .index("by_result", ["resultId"])
    .index("by_suite", ["suiteId"])
    .index("by_challenge", ["challengeId"])
    .index("by_model", ["modelId"]),
});
