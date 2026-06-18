export type ModelTestStatus = "draft" | "running" | "complete";

export type ModelTestModel = {
  _id: string;
  name: string;
  provider?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type ModelTestSuite = {
  _id: string;
  title: string;
  description?: string;
  status: ModelTestStatus;
  createdAt: number;
  updatedAt: number;
};

export type ModelTestSuiteModel = {
  _id: string;
  suiteId: string;
  modelId: string;
  order: number;
  createdAt: number;
};

export type ModelTestChallenge = {
  _id: string;
  suiteId: string;
  title: string;
  promptText?: string;
  expectedOutcome?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type ModelTestResult = {
  _id: string;
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
  createdAt: number;
  updatedAt: number;
};

export type ModelTestAttachment = {
  _id: string;
  resultId: string;
  suiteId: string;
  challengeId: string;
  modelId: string;
  url: string;
  objectKey?: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: number;
};

export type ModelTestWorkspace = {
  models: ModelTestModel[];
  suites: ModelTestSuite[];
  suiteModels: ModelTestSuiteModel[];
  challenges: ModelTestChallenge[];
  results: ModelTestResult[];
  attachments: ModelTestAttachment[];
};

export type ModelTestRubricKey =
  | "codeQuality"
  | "featureCoverage"
  | "reliability";

export const MODEL_TEST_STORAGE_KEY = "model-test-workspace-v2";

export const RUBRIC_ITEMS: {
  key: ModelTestRubricKey;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    key: "codeQuality",
    label: "Code quality",
    shortLabel: "Quality",
    description: "Architecture, maintainability, and fit with the codebase.",
  },
  {
    key: "featureCoverage",
    label: "Prompt feature",
    shortLabel: "Feature",
    description: "How completely the requested behavior was respected.",
  },
  {
    key: "reliability",
    label: "Reliability",
    shortLabel: "Reliable",
    description: "How stable the output felt across build, runtime, and edge cases.",
  },
];

export const emptyWorkspace: ModelTestWorkspace = {
  models: [],
  suites: [],
  suiteModels: [],
  challenges: [],
  results: [],
  attachments: [],
};

export function makeLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function scoreResult(result?: Pick<ModelTestResult, ModelTestRubricKey>) {
  if (!result) return null;

  const values = RUBRIC_ITEMS.map((item) => result[item.key]).filter(
    (value): value is number => typeof value === "number",
  );

  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function resultKey(challengeId: string, modelId: string) {
  return `${challengeId}::${modelId}`;
}

export function formatDuration(seconds?: number) {
  if (seconds === undefined) return "No time";
  if (seconds < 60) return `${seconds.toFixed(seconds % 1 ? 1 : 0)}s`;

  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}m ${rest}s`;
}

export function normalizeWorkspace(value: unknown): ModelTestWorkspace | null {
  if (!isRecord(value)) return null;

  if (
    !Array.isArray(value.models) ||
    !Array.isArray(value.suites) ||
    !Array.isArray(value.suiteModels) ||
    !Array.isArray(value.challenges) ||
    !Array.isArray(value.results) ||
    !Array.isArray(value.attachments)
  ) {
    return null;
  }

  const models = value.models.map(readModel).filter(isPresent);
  const suites = value.suites.map(readSuite).filter(isPresent);
  const suiteModels = value.suiteModels.map(readSuiteModel).filter(isPresent);
  const challenges = value.challenges.map(readChallenge).filter(isPresent);
  const results = value.results.map(readResult).filter(isPresent);
  const attachments = value.attachments.map(readAttachment).filter(isPresent);

  if (
    models.length !== value.models.length ||
    suites.length !== value.suites.length ||
    suiteModels.length !== value.suiteModels.length ||
    challenges.length !== value.challenges.length ||
    results.length !== value.results.length ||
    attachments.length !== value.attachments.length
  ) {
    return null;
  }

  return { models, suites, suiteModels, challenges, results, attachments };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readOptionalString(value: unknown) {
  return value === undefined || typeof value === "string" ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readOptionalNumber(value: unknown) {
  return value === undefined
    ? undefined
    : typeof value === "number" && Number.isFinite(value)
      ? value
      : null;
}

function readStatus(value: unknown): ModelTestStatus | null {
  return value === "draft" || value === "running" || value === "complete"
    ? value
    : null;
}

function readStringList(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;
}

function readModel(value: unknown): ModelTestModel | null {
  if (!isRecord(value)) return null;
  const _id = readString(value._id);
  const name = readString(value.name);
  const provider = readOptionalString(value.provider);
  const notes = readOptionalString(value.notes);
  const createdAt = readNumber(value.createdAt);
  const updatedAt = readNumber(value.updatedAt);
  if (!_id || !name || provider === null || notes === null || createdAt === null || updatedAt === null) return null;
  return { _id, name, provider, notes, createdAt, updatedAt };
}

function readSuite(value: unknown): ModelTestSuite | null {
  if (!isRecord(value)) return null;
  const _id = readString(value._id);
  const title = readString(value.title);
  const description = readOptionalString(value.description);
  const status = readStatus(value.status);
  const createdAt = readNumber(value.createdAt);
  const updatedAt = readNumber(value.updatedAt);
  if (!_id || !title || description === null || !status || createdAt === null || updatedAt === null) return null;
  return { _id, title, description, status, createdAt, updatedAt };
}

function readSuiteModel(value: unknown): ModelTestSuiteModel | null {
  if (!isRecord(value)) return null;
  const _id = readString(value._id);
  const suiteId = readString(value.suiteId);
  const modelId = readString(value.modelId);
  const order = readNumber(value.order);
  const createdAt = readNumber(value.createdAt);
  if (!_id || !suiteId || !modelId || order === null || createdAt === null) return null;
  return { _id, suiteId, modelId, order, createdAt };
}

function readChallenge(value: unknown): ModelTestChallenge | null {
  if (!isRecord(value)) return null;
  const _id = readString(value._id);
  const suiteId = readString(value.suiteId);
  const title = readString(value.title);
  const promptText = readOptionalString(value.promptText);
  const expectedOutcome = readOptionalString(value.expectedOutcome);
  const order = readNumber(value.order);
  const createdAt = readNumber(value.createdAt);
  const updatedAt = readNumber(value.updatedAt);
  if (!_id || !suiteId || !title || promptText === null || expectedOutcome === null || order === null || createdAt === null || updatedAt === null) return null;
  return { _id, suiteId, title, promptText, expectedOutcome, order, createdAt, updatedAt };
}

function readResult(value: unknown): ModelTestResult | null {
  if (!isRecord(value)) return null;
  const _id = readString(value._id);
  const suiteId = readString(value.suiteId);
  const challengeId = readString(value.challengeId);
  const modelId = readString(value.modelId);
  const durationSeconds = readOptionalNumber(value.durationSeconds);
  const shots = readOptionalNumber(value.shots);
  const codeQuality = readOptionalNumber(value.codeQuality);
  const featureCoverage = readOptionalNumber(value.featureCoverage);
  const reliability = readOptionalNumber(value.reliability);
  const notes = readOptionalString(value.notes);
  const positives = readStringList(value.positives);
  const negatives = readStringList(value.negatives);
  const createdAt = readNumber(value.createdAt);
  const updatedAt = readNumber(value.updatedAt);
  if (
    !_id ||
    !suiteId ||
    !challengeId ||
    !modelId ||
    durationSeconds === null ||
    shots === null ||
    codeQuality === null ||
    featureCoverage === null ||
    reliability === null ||
    notes === null ||
    !positives ||
    !negatives ||
    createdAt === null ||
    updatedAt === null
  ) {
    return null;
  }
  return {
    _id,
    suiteId,
    challengeId,
    modelId,
    durationSeconds,
    shots,
    codeQuality,
    featureCoverage,
    reliability,
    notes,
    positives,
    negatives,
    createdAt,
    updatedAt,
  };
}

function readAttachment(value: unknown): ModelTestAttachment | null {
  if (!isRecord(value)) return null;
  const _id = readString(value._id);
  const resultId = readString(value.resultId);
  const suiteId = readString(value.suiteId);
  const challengeId = readString(value.challengeId);
  const modelId = readString(value.modelId);
  const url = readString(value.url);
  const objectKey = readOptionalString(value.objectKey);
  const fileName = readString(value.fileName);
  const mimeType = readString(value.mimeType);
  const size = readNumber(value.size);
  const createdAt = readNumber(value.createdAt);
  if (
    !_id ||
    !resultId ||
    !suiteId ||
    !challengeId ||
    !modelId ||
    url === null ||
    objectKey === null ||
    !fileName ||
    !mimeType ||
    size === null ||
    createdAt === null
  ) {
    return null;
  }
  return {
    _id,
    resultId,
    suiteId,
    challengeId,
    modelId,
    url,
    objectKey,
    fileName,
    mimeType,
    size,
    createdAt,
  };
}

export function createStarterWorkspace(): ModelTestWorkspace {
  const timestamp = Date.now();
  const suiteId = makeLocalId("suite");

  return {
    models: [],
    suites: [
      {
        _id: suiteId,
        title: "Untitled model test",
        status: "draft",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    suiteModels: [],
    challenges: [],
    results: [],
    attachments: [],
  };
}

export function clampRating(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}
