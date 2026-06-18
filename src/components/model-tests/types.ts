import type { ModelTestStatus } from "@/lib/model-tests";

export type TestPrompt = {
  id: string;
  name: string;
  category?: string;
  slug?: string;
  isCustom?: boolean;
};

export type ResultInput = {
  suiteId: string;
  challengeId: string;
  modelId: string;
  durationSeconds?: number;
  shots?: number;
  codeQuality?: number;
  featureCoverage?: number;
  reliability?: number;
  notes?: string;
  positives: string[];
  negatives: string[];
};

export type BoardActions = {
  mode: "convex" | "local";
  isAdmin: boolean;
  adminRequired: boolean;
  passwordConfigured: boolean;
  uploadsConfigured: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  createModel: (input: {
    name: string;
    provider?: string;
    notes?: string;
  }) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  createSuite: (input: {
    title: string;
    description?: string;
    status?: ModelTestStatus;
  }) => Promise<string | void>;
  updateSuite: (
    suiteId: string,
    input: {
      title?: string;
      description?: string;
      status?: ModelTestStatus;
    },
  ) => Promise<void>;
  deleteSuite: (suiteId: string) => Promise<void>;
  setSuiteModels: (suiteId: string, modelIds: string[]) => Promise<void>;
  createChallenge: (input: {
    suiteId: string;
    title: string;
    promptText?: string;
    expectedOutcome?: string;
  }) => Promise<void>;
  updateChallenge: (
    challengeId: string,
    input: {
      title?: string;
      promptText?: string;
      expectedOutcome?: string;
      order?: number;
    },
  ) => Promise<void>;
  deleteChallenge: (challengeId: string) => Promise<void>;
  saveResult: (input: ResultInput, files: File[]) => Promise<void>;
  deleteResult: (resultId: string) => Promise<void>;
  removeAttachment: (attachmentId: string) => Promise<void>;
  seedStarterSuite: () => Promise<string | void>;
};
