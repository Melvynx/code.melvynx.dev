"use client";

import { useMemo, useState } from "react";
import { Clock, FileImage, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  RUBRIC_ITEMS,
  formatDuration,
  resultKey,
  scoreResult,
  type ModelTestAttachment,
  type ModelTestChallenge,
  type ModelTestModel,
  type ModelTestResult,
  type ModelTestStatus,
  type ModelTestSuite,
} from "@/lib/model-tests";
import { cn } from "@/lib/utils";
import type { TestPrompt } from "./types";
import { compactText } from "./utils";

const selectClassName =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

type ModelInput = {
  name: string;
  provider?: string;
  notes?: string;
};

type SuiteInput = {
  title?: string;
  description?: string;
  status?: ModelTestStatus;
};

export function ResultsMatrix({
  suites,
  selectedSuite,
  selectedModels,
  availableModels,
  challenges,
  systemPrompts,
  resultsByKey,
  attachmentsByResult,
  canWrite,
  busy,
  completion,
  resultCount,
  onSelectSuite,
  onCreateSuite,
  onDeleteSuite,
  onUpdateSuite,
  onCreateModel,
  onUpdateModel,
  onRemoveModel,
  onAddExistingModel,
  onCreateChallenge,
  onEdit,
  onDeleteChallenge,
  onUpdateChallenge,
}: {
  suites: ModelTestSuite[];
  selectedSuite: ModelTestSuite;
  selectedModels: ModelTestModel[];
  availableModels: ModelTestModel[];
  challenges: ModelTestChallenge[];
  systemPrompts: TestPrompt[];
  resultsByKey: Map<string, ModelTestResult>;
  attachmentsByResult: Map<string, ModelTestAttachment[]>;
  canWrite: boolean;
  busy: boolean;
  completion: number;
  resultCount: number;
  onSelectSuite: (suiteId: string) => void;
  onCreateSuite: () => void;
  onDeleteSuite: () => void;
  onUpdateSuite: (input: SuiteInput) => void;
  onCreateModel: (input: ModelInput) => void;
  onUpdateModel: (modelId: string, input: ModelInput) => void;
  onRemoveModel: (modelId: string) => void;
  onAddExistingModel: (modelId: string) => void;
  onCreateChallenge: (input: {
    title: string;
    promptText?: string;
    expectedOutcome?: string;
  }) => void;
  onEdit: (
    challenge: ModelTestChallenge,
    model: ModelTestModel,
    result?: ModelTestResult,
  ) => void;
  onDeleteChallenge: (challengeId: string) => void;
  onUpdateChallenge: (
    challengeId: string,
    input: { title?: string; promptText?: string; expectedOutcome?: string },
  ) => void;
}) {
  const expectedResults = challenges.length * selectedModels.length;

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <SuiteToolbar
        key={selectedSuite._id}
        suites={suites}
        selectedSuite={selectedSuite}
        canWrite={canWrite}
        busy={busy}
        completion={completion}
        resultCount={resultCount}
        expectedResults={expectedResults}
        onSelectSuite={onSelectSuite}
        onCreateSuite={onCreateSuite}
        onDeleteSuite={onDeleteSuite}
        onUpdateSuite={onUpdateSuite}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/45">
              <th className="sticky left-0 z-20 w-[320px] border-r bg-muted px-4 py-3 text-left font-medium">
                Challenge
              </th>
              {selectedModels.map((model) => (
                <th
                  key={model._id}
                  className="min-w-[250px] border-r px-3 py-3 text-left align-top last:border-r-0"
                >
                  <ModelHeaderEditor
                    model={model}
                    canWrite={canWrite}
                    busy={busy}
                    onUpdate={(input) => onUpdateModel(model._id, input)}
                    onRemove={() => onRemoveModel(model._id)}
                  />
                </th>
              ))}
              <th className="min-w-[260px] px-3 py-3 text-left align-top">
                <AddModelColumn
                  availableModels={availableModels}
                  canWrite={canWrite}
                  busy={busy}
                  onCreate={onCreateModel}
                  onAddExisting={onAddExistingModel}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((challenge) => (
              <tr key={challenge._id} className="border-b last:border-b-0">
                <td className="sticky left-0 z-10 border-r bg-card p-4 align-top">
                  <InlineChallengeEditor
                    challenge={challenge}
                    canWrite={canWrite}
                    busy={busy}
                    onDelete={() => onDeleteChallenge(challenge._id)}
                    onUpdate={(input) =>
                      onUpdateChallenge(challenge._id, input)
                    }
                  />
                </td>
                {selectedModels.map((model) => {
                  const result = resultsByKey.get(
                    resultKey(challenge._id, model._id),
                  );
                  const score = scoreResult(result);
                  const attachments = result
                    ? attachmentsByResult.get(result._id) ?? []
                    : [];

                  return (
                    <td key={model._id} className="border-r p-3 align-top last:border-r-0">
                      <button
                        type="button"
                        disabled={!canWrite}
                        onClick={() => onEdit(challenge, model, result)}
                        className={cn(
                          "min-h-36 w-full rounded-md border bg-background p-3 text-left transition-colors",
                          canWrite
                            ? "hover:bg-muted/60 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
                            : "cursor-not-allowed opacity-70",
                        )}
                      >
                        {result ? (
                          <ResultCell
                            result={result}
                            score={score}
                            attachmentCount={attachments.length}
                          />
                        ) : (
                          <div className="flex h-full min-h-28 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                            <Pencil className="size-4" />
                            <span className="text-xs">Add result</span>
                          </div>
                        )}
                      </button>
                    </td>
                  );
                })}
                <td className="p-3 align-top">
                  <div className="min-h-36 rounded-md border border-dashed bg-muted/20" />
                </td>
              </tr>
            ))}
            <AddChallengeRow
              columnCount={selectedModels.length + 2}
              systemPrompts={systemPrompts}
              canWrite={canWrite}
              busy={busy}
              onCreate={onCreateChallenge}
            />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SuiteToolbar({
  suites,
  selectedSuite,
  canWrite,
  busy,
  completion,
  resultCount,
  expectedResults,
  onSelectSuite,
  onCreateSuite,
  onDeleteSuite,
  onUpdateSuite,
}: {
  suites: ModelTestSuite[];
  selectedSuite: ModelTestSuite;
  canWrite: boolean;
  busy: boolean;
  completion: number;
  resultCount: number;
  expectedResults: number;
  onSelectSuite: (suiteId: string) => void;
  onCreateSuite: () => void;
  onDeleteSuite: () => void;
  onUpdateSuite: (input: SuiteInput) => void;
}) {
  const [title, setTitle] = useState(selectedSuite.title);

  function saveTitle() {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === selectedSuite.title) return;
    onUpdateSuite({ title: nextTitle });
  }

  return (
    <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center">
        <select
          value={selectedSuite._id}
          onChange={(event) => onSelectSuite(event.target.value)}
          className={cn(selectClassName, "w-full md:w-64")}
        >
          {suites.map((suite) => (
            <option key={suite._id} value={suite._id}>
              {suite.title}
            </option>
          ))}
        </select>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={saveTitle}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          disabled={!canWrite || busy}
          aria-label="Suite name"
          className="min-w-0 flex-1"
        />
        <select
          value={selectedSuite.status}
          disabled={!canWrite || busy}
          onChange={(event) =>
            onUpdateSuite({ status: event.target.value as ModelTestStatus })
          }
          className={cn(selectClassName, "w-full md:w-36")}
          aria-label="Suite status"
        >
          <option value="draft">Draft</option>
          <option value="running">Running</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Metric label="Done" value={`${completion}%`} />
        <Metric label="Results" value={`${resultCount}/${expectedResults}`} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canWrite || busy}
          onClick={onCreateSuite}
        >
          <Plus className="size-4" />
          Suite
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!canWrite || busy || suites.length <= 1}
          onClick={onDeleteSuite}
          aria-label={`Delete ${selectedSuite.title}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-20 rounded-md border bg-background px-3 py-1.5 text-center">
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ModelHeaderEditor({
  model,
  canWrite,
  busy,
  onUpdate,
  onRemove,
}: {
  model: ModelTestModel;
  canWrite: boolean;
  busy: boolean;
  onUpdate: (input: ModelInput) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(model.name);
  const [provider, setProvider] = useState(model.provider ?? "");

  const dirty =
    name.trim() !== model.name || compactText(provider) !== model.provider;

  function save() {
    if (!name.trim() || !dirty) return;
    onUpdate({
      name: name.trim(),
      provider: compactText(provider),
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            disabled={!canWrite || busy}
            aria-label={`${model.name} name`}
            className="h-9 font-medium"
          />
          <Input
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            disabled={!canWrite || busy}
            placeholder="Provider"
            aria-label={`${model.name} provider`}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={!canWrite || busy || !dirty || !name.trim()}
            onClick={save}
            aria-label={`Save ${model.name}`}
          >
            <Save className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={!canWrite || busy}
            onClick={onRemove}
            aria-label={`Remove ${model.name} from suite`}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddModelColumn({
  availableModels,
  canWrite,
  busy,
  onCreate,
  onAddExisting,
}: {
  availableModels: ModelTestModel[];
  canWrite: boolean;
  busy: boolean;
  onCreate: (input: ModelInput) => void;
  onAddExisting: (modelId: string) => void;
}) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [existingModelId, setExistingModelId] = useState("");

  return (
    <div className="space-y-2">
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onCreate({ name, provider: compactText(provider) });
          setName("");
          setProvider("");
        }}
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Model name"
          disabled={!canWrite || busy}
          aria-label="New model name"
          className="h-9"
        />
        <div className="flex gap-2">
          <Input
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            placeholder="Provider"
            disabled={!canWrite || busy}
            aria-label="New model provider"
            className="h-8 text-xs"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!canWrite || busy || !name.trim()}
            aria-label="Add model column"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </form>
      {availableModels.length > 0 && (
        <div className="flex gap-2">
          <select
            value={existingModelId}
            onChange={(event) => setExistingModelId(event.target.value)}
            disabled={!canWrite || busy}
            className={cn(selectClassName, "h-8 min-w-0 flex-1 text-xs")}
            aria-label="Existing model"
          >
            <option value="">Existing model</option>
            {availableModels.map((model) => (
              <option key={model._id} value={model._id}>
                {model.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canWrite || busy || !existingModelId}
            onClick={() => {
              onAddExisting(existingModelId);
              setExistingModelId("");
            }}
            aria-label="Add existing model column"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function AddChallengeRow({
  columnCount,
  systemPrompts,
  canWrite,
  busy,
  onCreate,
}: {
  columnCount: number;
  systemPrompts: TestPrompt[];
  canWrite: boolean;
  busy: boolean;
  onCreate: (input: {
    title: string;
    promptText?: string;
    expectedOutcome?: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");

  return (
    <tr>
      <td colSpan={columnCount} className="bg-muted/20 p-3">
        <form
          className="grid gap-2 lg:grid-cols-[minmax(180px,0.65fr)_minmax(220px,0.75fr)_minmax(260px,1fr)_minmax(220px,0.9fr)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            onCreate({
              title,
              promptText: compactText(promptText),
              expectedOutcome: compactText(expectedOutcome),
            });
            setTitle("");
            setPromptText("");
            setExpectedOutcome("");
          }}
        >
          <select
            defaultValue=""
            disabled={!canWrite || busy || systemPrompts.length === 0}
            className={selectClassName}
            aria-label="Import prompt"
            onChange={(event) => {
              const prompt = systemPrompts.find(
                (item) => item.id === event.target.value,
              );
              if (!prompt) return;
              setTitle(prompt.name);
              setPromptText(`Prompt library: ${prompt.name}`);
              event.target.value = "";
            }}
          >
            <option value="">Import prompt</option>
            {systemPrompts.map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name}
              </option>
            ))}
          </select>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Challenge name"
            disabled={!canWrite || busy}
            aria-label="Challenge name"
          />
          <Textarea
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder="Prompt or task"
            className="min-h-10 resize-y"
            disabled={!canWrite || busy}
            aria-label="Prompt or task"
          />
          <Textarea
            value={expectedOutcome}
            onChange={(event) => setExpectedOutcome(event.target.value)}
            placeholder="Expected outcome"
            className="min-h-10 resize-y"
            disabled={!canWrite || busy}
            aria-label="Expected outcome"
          />
          <Button
            type="submit"
            disabled={!canWrite || busy || !title.trim()}
            className="self-start"
          >
            <Plus className="size-4" />
            Challenge
          </Button>
        </form>
      </td>
    </tr>
  );
}

function InlineChallengeEditor({
  challenge,
  canWrite,
  busy,
  onDelete,
  onUpdate,
}: {
  challenge: ModelTestChallenge;
  canWrite: boolean;
  busy: boolean;
  onDelete: () => void;
  onUpdate: (input: {
    title?: string;
    promptText?: string;
    expectedOutcome?: string;
  }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(challenge.title);
  const [promptText, setPromptText] = useState(challenge.promptText ?? "");
  const [expectedOutcome, setExpectedOutcome] = useState(
    challenge.expectedOutcome ?? "",
  );

  const dirty = useMemo(
    () =>
      title.trim() !== challenge.title ||
      compactText(promptText) !== challenge.promptText ||
      compactText(expectedOutcome) !== challenge.expectedOutcome,
    [challenge.expectedOutcome, challenge.promptText, challenge.title, expectedOutcome, promptText, title],
  );

  if (editing) {
    return (
      <div className="space-y-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={busy}
        />
        <Textarea
          value={promptText}
          onChange={(event) => setPromptText(event.target.value)}
          className="min-h-20"
          disabled={busy}
        />
        <Textarea
          value={expectedOutcome}
          onChange={(event) => setExpectedOutcome(event.target.value)}
          className="min-h-20"
          disabled={busy}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy || !title.trim() || !dirty}
            onClick={() => {
              onUpdate({
                title,
                promptText: compactText(promptText),
                expectedOutcome: compactText(expectedOutcome),
              });
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setTitle(challenge.title);
              setPromptText(challenge.promptText ?? "");
              setExpectedOutcome(challenge.expectedOutcome ?? "");
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium">{challenge.title}</div>
          {challenge.promptText && (
            <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
              {challenge.promptText}
            </p>
          )}
          {challenge.expectedOutcome && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {challenge.expectedOutcome}
            </p>
          )}
        </div>
        {canWrite && (
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`Edit ${challenge.title}`}
              onClick={() => {
                setTitle(challenge.title);
                setPromptText(challenge.promptText ?? "");
                setExpectedOutcome(challenge.expectedOutcome ?? "");
                setEditing(true);
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`Delete ${challenge.title}`}
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCell({
  result,
  score,
  attachmentCount,
}: {
  result: ModelTestResult;
  score: number | null;
  attachmentCount: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">
          {score ? score.toFixed(1) : "New"}
        </div>
        <Badge variant={score ? "secondary" : "outline"}>/5</Badge>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {RUBRIC_ITEMS.map((item) => (
          <div key={item.key} className="rounded bg-muted/60 px-2 py-1">
            <div className="text-xs font-medium">{result[item.key] ?? "-"}</div>
            <div className="truncate text-[10px] text-muted-foreground">
              {item.shortLabel}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {formatDuration(result.durationSeconds)}
        </span>
        <span>{result.shots ?? 0} shots</span>
        {attachmentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <FileImage className="size-3" />
            {attachmentCount}
          </span>
        )}
      </div>
      {(result.positives.length > 0 || result.negatives.length > 0) && (
        <div className="flex gap-2 text-xs">
          <span className="text-emerald-700 dark:text-emerald-300">
            +{result.positives.length}
          </span>
          <span className="text-destructive">-{result.negatives.length}</span>
        </div>
      )}
    </div>
  );
}
