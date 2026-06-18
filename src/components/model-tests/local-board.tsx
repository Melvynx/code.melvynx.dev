"use client";

import { useEffect, useRef, useState } from "react";
import {
  MODEL_TEST_STORAGE_KEY,
  createStarterWorkspace,
  emptyWorkspace,
  makeLocalId,
  normalizeWorkspace,
  type ModelTestAttachment,
  type ModelTestResult,
  type ModelTestWorkspace,
} from "@/lib/model-tests";
import { ModelTestExperience } from "./experience";
import type { BoardActions, TestPrompt } from "./types";
import { compactText, fileToDataUrl } from "./utils";

const MAX_LOCAL_IMAGE_BYTES = 1024 * 1024;
const MAX_LOCAL_WORKSPACE_BYTES = 4 * 1024 * 1024;

type Props = {
  systemPrompts: TestPrompt[];
};

export function LocalModelTestBoard({ systemPrompts }: Props) {
  const [workspace, setWorkspace] = useState<ModelTestWorkspace>(emptyWorkspace);
  const workspaceRef = useRef<ModelTestWorkspace>(emptyWorkspace);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MODEL_TEST_STORAGE_KEY);
      if (raw) {
        const parsed = normalizeWorkspace(JSON.parse(raw));
        if (parsed) {
          workspaceRef.current = parsed;
          setWorkspace(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(MODEL_TEST_STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  function saveWorkspace(
    updater: (previous: ModelTestWorkspace) => ModelTestWorkspace,
  ) {
    const next = updater(workspaceRef.current);
    const serialized = JSON.stringify(next);
    if (new Blob([serialized]).size > MAX_LOCAL_WORKSPACE_BYTES) {
      throw new Error(
        "Local model-test storage is full. Remove some local images or connect Convex/R2.",
      );
    }

    try {
      window.localStorage.setItem(MODEL_TEST_STORAGE_KEY, serialized);
    } catch {
      throw new Error(
        "Could not save model-test data locally. Remove images or enable Convex persistence.",
      );
    }

    workspaceRef.current = next;
    setWorkspace(next);
  }

  function assertLocalFiles(files: File[]) {
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image uploads are allowed.");
      }
      if (file.size > MAX_LOCAL_IMAGE_BYTES) {
        throw new Error(
          "Local images must be 1 MB or smaller. Use Convex/R2 for larger shots.",
        );
      }
    }
  }

  const actions: BoardActions = {
    mode: "local",
    isAdmin: true,
    adminRequired: false,
    passwordConfigured: true,
    uploadsConfigured: true,
    login: async () => {},
    logout: () => {},
    createModel: async (input) => {
      const timestamp = Date.now();
      const modelId = makeLocalId("model");
      saveWorkspace((previous) => ({
        ...previous,
        models: [
          ...previous.models,
          {
            _id: modelId,
            name: input.name.trim(),
            provider: compactText(input.provider),
            notes: compactText(input.notes),
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      }));
      return modelId;
    },
    updateModel: async (modelId, input) => {
      saveWorkspace((previous) => ({
        ...previous,
        models: previous.models.map((model) =>
          model._id === modelId
            ? {
                ...model,
                ...(input.name !== undefined
                  ? { name: input.name.trim() }
                  : {}),
                ...(input.provider !== undefined
                  ? { provider: compactText(input.provider) }
                  : {}),
                ...(input.notes !== undefined
                  ? { notes: compactText(input.notes) }
                  : {}),
                updatedAt: Date.now(),
              }
            : model,
        ),
      }));
    },
    deleteModel: async (modelId) => {
      saveWorkspace((previous) => {
        const resultIds = new Set(
          previous.results
            .filter((result) => result.modelId === modelId)
            .map((result) => result._id),
        );
        return {
          ...previous,
          models: previous.models.filter((model) => model._id !== modelId),
          suiteModels: previous.suiteModels.filter(
            (link) => link.modelId !== modelId,
          ),
          results: previous.results.filter(
            (result) => result.modelId !== modelId,
          ),
          attachments: previous.attachments.filter(
            (attachment) => !resultIds.has(attachment.resultId),
          ),
        };
      });
    },
    createSuite: async (input) => {
      const timestamp = Date.now();
      const suiteId = makeLocalId("suite");
      saveWorkspace((previous) => ({
        ...previous,
        suites: [
          {
            _id: suiteId,
            title: input.title.trim(),
            description: compactText(input.description),
            status: input.status ?? "draft",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          ...previous.suites,
        ],
      }));
      return suiteId;
    },
    updateSuite: async (suiteId, input) => {
      saveWorkspace((previous) => ({
        ...previous,
        suites: previous.suites.map((suite) =>
          suite._id === suiteId
            ? {
                ...suite,
                ...(input.title !== undefined
                  ? { title: input.title.trim() }
                  : {}),
                ...(input.description !== undefined
                  ? { description: compactText(input.description) }
                  : {}),
                ...(input.status !== undefined ? { status: input.status } : {}),
                updatedAt: Date.now(),
              }
            : suite,
        ),
      }));
    },
    deleteSuite: async (suiteId) => {
      saveWorkspace((previous) => {
        const resultIds = new Set(
          previous.results
            .filter((result) => result.suiteId === suiteId)
            .map((result) => result._id),
        );
        return {
          ...previous,
          suites: previous.suites.filter((suite) => suite._id !== suiteId),
          suiteModels: previous.suiteModels.filter(
            (link) => link.suiteId !== suiteId,
          ),
          challenges: previous.challenges.filter(
            (challenge) => challenge.suiteId !== suiteId,
          ),
          results: previous.results.filter(
            (result) => result.suiteId !== suiteId,
          ),
          attachments: previous.attachments.filter(
            (attachment) => !resultIds.has(attachment.resultId),
          ),
        };
      });
    },
    setSuiteModels: async (suiteId, modelIds) => {
      const timestamp = Date.now();
      saveWorkspace((previous) => ({
        ...previous,
        suiteModels: [
          ...previous.suiteModels.filter((link) => link.suiteId !== suiteId),
          ...Array.from(new Set(modelIds)).map((modelId, order) => ({
            _id: makeLocalId("suite_model"),
            suiteId,
            modelId,
            order,
            createdAt: timestamp,
          })),
        ],
        suites: previous.suites.map((suite) =>
          suite._id === suiteId ? { ...suite, updatedAt: timestamp } : suite,
        ),
      }));
    },
    createChallenge: async (input) => {
      const timestamp = Date.now();
      saveWorkspace((previous) => {
        const existing = previous.challenges.filter(
          (challenge) => challenge.suiteId === input.suiteId,
        );
        return {
          ...previous,
          challenges: [
            ...previous.challenges,
            {
              _id: makeLocalId("challenge"),
              suiteId: input.suiteId,
              title: input.title.trim(),
              promptText: compactText(input.promptText),
              expectedOutcome: compactText(input.expectedOutcome),
              order: existing.length,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
        };
      });
    },
    updateChallenge: async (challengeId, input) => {
      saveWorkspace((previous) => ({
        ...previous,
        challenges: previous.challenges.map((challenge) =>
          challenge._id === challengeId
            ? {
                ...challenge,
                ...(input.title !== undefined
                  ? { title: input.title.trim() }
                  : {}),
                ...(input.promptText !== undefined
                  ? { promptText: compactText(input.promptText) }
                  : {}),
                ...(input.expectedOutcome !== undefined
                  ? { expectedOutcome: compactText(input.expectedOutcome) }
                  : {}),
                ...(input.order !== undefined ? { order: input.order } : {}),
                updatedAt: Date.now(),
              }
            : challenge,
        ),
      }));
    },
    deleteChallenge: async (challengeId) => {
      saveWorkspace((previous) => {
        const resultIds = new Set(
          previous.results
            .filter((result) => result.challengeId === challengeId)
            .map((result) => result._id),
        );
        return {
          ...previous,
          challenges: previous.challenges.filter(
            (challenge) => challenge._id !== challengeId,
          ),
          results: previous.results.filter(
            (result) => result.challengeId !== challengeId,
          ),
          attachments: previous.attachments.filter(
            (attachment) => !resultIds.has(attachment.resultId),
          ),
        };
      });
    },
    saveResult: async (input, files) => {
      assertLocalFiles(files);
      const timestamp = Date.now();
      const previous = workspaceRef.current;
      const existingBeforeSave = previous.results.find(
        (result) =>
          result.challengeId === input.challengeId &&
          result.modelId === input.modelId,
      );
      const nextResultId = existingBeforeSave?._id ?? makeLocalId("result");
      const dataUrls = await Promise.all(files.map(fileToDataUrl));
      const newAttachments: ModelTestAttachment[] = files.map(
        (file, index) => ({
          _id: makeLocalId("attachment"),
          resultId: nextResultId,
          suiteId: input.suiteId,
          challengeId: input.challengeId,
          modelId: input.modelId,
          url: dataUrls[index] ?? "",
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          createdAt: timestamp,
        }),
      );

      saveWorkspace((previous) => {
        const existing = previous.results.find(
          (result) =>
            result.challengeId === input.challengeId &&
            result.modelId === input.modelId,
        );
        const resultId = existing?._id ?? nextResultId;

        const nextResult: ModelTestResult = {
          _id: resultId,
          suiteId: input.suiteId,
          challengeId: input.challengeId,
          modelId: input.modelId,
          durationSeconds: input.durationSeconds,
          shots: input.shots,
          codeQuality: input.codeQuality,
          featureCoverage: input.featureCoverage,
          reliability: input.reliability,
          notes: compactText(input.notes ?? ""),
          positives: input.positives,
          negatives: input.negatives,
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        return {
          ...previous,
          results: existing
            ? previous.results.map((result) =>
                result._id === existing._id ? nextResult : result,
              )
            : [...previous.results, nextResult],
          attachments: [
            ...previous.attachments,
            ...newAttachments.map((attachment) => ({
              ...attachment,
              resultId,
            })),
          ],
        };
      });
    },
    deleteResult: async (resultId) => {
      saveWorkspace((previous) => ({
        ...previous,
        results: previous.results.filter((result) => result._id !== resultId),
        attachments: previous.attachments.filter(
          (attachment) => attachment.resultId !== resultId,
        ),
      }));
    },
    removeAttachment: async (attachmentId) => {
      saveWorkspace((previous) => ({
        ...previous,
        attachments: previous.attachments.filter(
          (attachment) => attachment._id !== attachmentId,
        ),
      }));
    },
    seedStarterSuite: async () => {
      const starter = createStarterWorkspace();
      saveWorkspace(() => starter);
      return starter.suites[0]?._id;
    },
  };

  return (
    <ModelTestExperience
      systemPrompts={systemPrompts}
      workspace={workspace}
      isLoading={!loaded}
      actions={actions}
    />
  );
}
