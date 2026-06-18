"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { emptyWorkspace, normalizeWorkspace, type ModelTestWorkspace } from "@/lib/model-tests";
import { ModelTestExperience } from "./experience";
import type { BoardActions, TestPrompt } from "./types";
import { fileToBase64 } from "./utils";

function asSuiteId(id: string) {
  return id as Id<"modelTestSuites">;
}

function asModelId(id: string) {
  return id as Id<"modelTestModels">;
}

function asChallengeId(id: string) {
  return id as Id<"modelTestChallenges">;
}

function asResultId(id: string) {
  return id as Id<"modelTestResults">;
}

function asAttachmentId(id: string) {
  return id as Id<"modelTestAttachments">;
}

type Props = {
  systemPrompts: TestPrompt[];
};

function toWorkspace(value: unknown): ModelTestWorkspace {
  const workspace = normalizeWorkspace(value);
  if (!workspace) return emptyWorkspace;

  return {
    models: workspace.models.map((model) => ({ ...model, _id: String(model._id) })),
    suites: workspace.suites.map((suite) => ({ ...suite, _id: String(suite._id) })),
    suiteModels: workspace.suiteModels.map((link) => ({
      ...link,
      _id: String(link._id),
      suiteId: String(link.suiteId),
      modelId: String(link.modelId),
    })),
    challenges: workspace.challenges.map((challenge) => ({
      ...challenge,
      _id: String(challenge._id),
      suiteId: String(challenge.suiteId),
    })),
    results: workspace.results.map((result) => ({
      ...result,
      _id: String(result._id),
      suiteId: String(result.suiteId),
      challengeId: String(result.challengeId),
      modelId: String(result.modelId),
    })),
    attachments: workspace.attachments.map((attachment) => ({
      ...attachment,
      _id: String(attachment._id),
      resultId: String(attachment.resultId),
      suiteId: String(attachment.suiteId),
      challengeId: String(attachment.challengeId),
      modelId: String(attachment.modelId),
    })),
  };
}

export function ConvexModelTestBoard({ systemPrompts }: Props) {
  return (
    <ConvexClientProvider>
      <ConvexModelTestBoardContent systemPrompts={systemPrompts} />
    </ConvexClientProvider>
  );
}

function ConvexModelTestBoardContent({ systemPrompts }: Props) {
  const config = useQuery(api.modelTests.publicConfig);
  const workspace = useQuery(api.modelTests.listWorkspace);
  const verifyAdminPassword = useMutation(api.modelTests.verifyAdminPassword);
  const createModel = useMutation(api.modelTests.createModel);
  const createSuite = useMutation(api.modelTests.createSuite);
  const updateSuite = useMutation(api.modelTests.updateSuite);
  const setSuiteModels = useMutation(api.modelTests.setSuiteModels);
  const createChallenge = useMutation(api.modelTests.createChallenge);
  const updateChallenge = useMutation(api.modelTests.updateChallenge);
  const upsertResult = useMutation(api.modelTests.upsertResult);
  const addAttachment = useMutation(api.modelTests.addAttachment);
  const seedStarterSuite = useMutation(api.modelTests.seedStarterSuite);
  const uploadResultImage = useAction(api.modelTestUploads.uploadResultImage);
  const deleteUploadedImage = useAction(api.modelTestUploads.deleteUploadedImage);
  const deleteModelWithImages = useAction(api.modelTestUploads.deleteModelWithImages);
  const deleteSuiteWithImages = useAction(api.modelTestUploads.deleteSuiteWithImages);
  const deleteChallengeWithImages = useAction(api.modelTestUploads.deleteChallengeWithImages);
  const deleteResultWithImages = useAction(api.modelTestUploads.deleteResultWithImages);
  const removeResultImage = useAction(api.modelTestUploads.removeResultImage);
  const [adminPassword, setAdminPassword] = useState("");

  const requirePassword = () => {
    if (!adminPassword) throw new Error("Log in before editing Convex data.");
    return adminPassword;
  };

  const actions: BoardActions = {
    mode: "convex",
    isAdmin: Boolean(adminPassword),
    adminRequired: true,
    passwordConfigured: config?.passwordConfigured ?? false,
    uploadsConfigured: config?.uploadsConfigured ?? false,
    login: async (password) => {
      await verifyAdminPassword({ adminPassword: password });
      setAdminPassword(password);
    },
    logout: () => {
      setAdminPassword("");
    },
    createModel: async (input) => {
      await createModel({ adminPassword: requirePassword(), ...input });
    },
    deleteModel: async (modelId) => {
      await deleteModelWithImages({
        adminPassword: requirePassword(),
        modelId: asModelId(modelId),
      });
    },
    createSuite: async (input) =>
      await createSuite({ adminPassword: requirePassword(), ...input }),
    updateSuite: async (suiteId, input) => {
      await updateSuite({
        adminPassword: requirePassword(),
        suiteId: asSuiteId(suiteId),
        ...input,
      });
    },
    deleteSuite: async (suiteId) => {
      await deleteSuiteWithImages({
        adminPassword: requirePassword(),
        suiteId: asSuiteId(suiteId),
      });
    },
    setSuiteModels: async (suiteId, modelIds) => {
      await setSuiteModels({
        adminPassword: requirePassword(),
        suiteId: asSuiteId(suiteId),
        modelIds: modelIds.map(asModelId),
      });
    },
    createChallenge: async (input) => {
      await createChallenge({
        adminPassword: requirePassword(),
        suiteId: asSuiteId(input.suiteId),
        title: input.title,
        promptText: input.promptText,
        expectedOutcome: input.expectedOutcome,
      });
    },
    updateChallenge: async (challengeId, input) => {
      await updateChallenge({
        adminPassword: requirePassword(),
        challengeId: asChallengeId(challengeId),
        ...input,
      });
    },
    deleteChallenge: async (challengeId) => {
      await deleteChallengeWithImages({
        adminPassword: requirePassword(),
        challengeId: asChallengeId(challengeId),
      });
    },
    saveResult: async (input, files) => {
      const password = requirePassword();
      if (files.length > 0 && !(config?.uploadsConfigured ?? false)) {
        throw new Error("R2 upload environment is not configured.");
      }

      const uploadedFiles = await Promise.all(
        files.map(async (file) =>
          uploadResultImage({
            adminPassword: password,
            base64: await fileToBase64(file),
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
          }),
        ),
      );

      try {
        const resultId = await upsertResult({
          adminPassword: password,
          suiteId: asSuiteId(input.suiteId),
          challengeId: asChallengeId(input.challengeId),
          modelId: asModelId(input.modelId),
          durationSeconds: input.durationSeconds,
          shots: input.shots,
          codeQuality: input.codeQuality,
          featureCoverage: input.featureCoverage,
          reliability: input.reliability,
          notes: input.notes,
          positives: input.positives,
          negatives: input.negatives,
        });

        await Promise.all(
          uploadedFiles.map((uploaded) =>
            addAttachment({
              adminPassword: password,
              resultId,
              ...uploaded,
            }),
          ),
        );
      } catch (error) {
        await Promise.allSettled(
          uploadedFiles.map((uploaded) =>
            deleteUploadedImage({
              adminPassword: password,
              objectKey: uploaded.objectKey,
            }),
          ),
        );
        throw error;
      }
    },
    deleteResult: async (resultId) => {
      await deleteResultWithImages({
        adminPassword: requirePassword(),
        resultId: asResultId(resultId),
      });
    },
    removeAttachment: async (attachmentId) => {
      await removeResultImage({
        adminPassword: requirePassword(),
        attachmentId: asAttachmentId(attachmentId),
      });
    },
    seedStarterSuite: async () =>
      await seedStarterSuite({ adminPassword: requirePassword() }),
  };

  return (
    <ModelTestExperience
      systemPrompts={systemPrompts}
      workspace={toWorkspace(workspace)}
      isLoading={workspace === undefined || config === undefined}
      actions={actions}
    />
  );
}
