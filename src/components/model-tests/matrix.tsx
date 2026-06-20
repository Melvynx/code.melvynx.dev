"use client";

import { useMemo, useState } from "react";
import { Clock, ImageIcon, Pencil, Plus, Save, Trash2, X } from "lucide-react";
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
import { STATUS_META } from "./board-header";

const selectClassName =
  "h-8 rounded-md border border-input bg-background px-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

const inlineFieldClassName =
  "border-transparent bg-transparent px-2 shadow-none hover:bg-muted/60 focus-visible:bg-background dark:bg-transparent dark:hover:bg-muted/60";

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
    <section className="overflow-hidden rounded-xl border bg-card">
      <SuiteToolbar
        key={selectedSuite._id}
        selectedSuite={selectedSuite}
        canWrite={canWrite}
        busy={busy}
        completion={completion}
        resultCount={resultCount}
        expectedResults={expectedResults}
        onDeleteSuite={onDeleteSuite}
        onUpdateSuite={onUpdateSuite}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="sticky left-0 z-20 w-[320px] border-r bg-muted/60 px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground backdrop-blur">
                Challenge
              </th>
              {selectedModels.map((model) => (
                <th
                  key={model._id}
                  className="group/col min-w-[244px] border-r px-3 py-2.5 text-left align-top last:border-r-0"
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
              <th className="min-w-[252px] px-3 py-2.5 text-left align-top">
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
            {challenges.map((challenge, index) => (
              <tr key={challenge._id} className="group/row border-b last:border-b-0">
                <td className="sticky left-0 z-10 border-r bg-card p-4 align-top group-hover/row:bg-muted/30">
                  <InlineChallengeEditor
                    index={index}
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
                    <td key={model._id} className="border-r p-2.5 align-top last:border-r-0">
                      <button
                        type="button"
                        disabled={!canWrite}
                        onClick={() => onEdit(challenge, model, result)}
                        className={cn(
                          "min-h-[8.5rem] w-full rounded-lg border p-3 text-left transition-colors",
                          result
                            ? "border-border bg-background"
                            : "border-dashed border-border/60 bg-transparent",
                          canWrite
                            ? "hover:border-foreground/25 hover:bg-muted/40 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
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
                          <div className="flex h-full min-h-[7rem] flex-col items-center justify-center gap-1.5 text-muted-foreground/55">
                            <Plus className="size-4" />
                            <span className="text-xs font-medium">Add result</span>
                          </div>
                        )}
                      </button>
                    </td>
                  );
                })}
                <td className="p-2.5 align-top">
                  <div className="min-h-[8.5rem] rounded-lg border border-dashed border-border/50" />
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
  selectedSuite,
  canWrite,
  busy,
  completion,
  resultCount,
  expectedResults,
  onDeleteSuite,
  onUpdateSuite,
}: {
  selectedSuite: ModelTestSuite;
  canWrite: boolean;
  busy: boolean;
  completion: number;
  resultCount: number;
  expectedResults: number;
  onDeleteSuite: () => void;
  onUpdateSuite: (input: SuiteInput) => void;
}) {
  const [title, setTitle] = useState(selectedSuite.title);
  const status = STATUS_META[selectedSuite.status];

  function saveTitle() {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === selectedSuite.title) return;
    onUpdateSuite({ title: nextTitle });
  }

  return (
    <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={saveTitle}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          disabled={!canWrite || busy}
          aria-label="Suite name"
          className={cn(
            inlineFieldClassName,
            "h-9 w-full max-w-md text-lg font-semibold tracking-tight",
          )}
        />
        <div className="relative">
          <span
            className={cn(
              "pointer-events-none absolute left-2.5 top-1/2 size-2 -translate-y-1/2 rounded-full",
              status.dot,
            )}
          />
          <select
            value={selectedSuite.status}
            disabled={!canWrite || busy}
            onChange={(event) =>
              onUpdateSuite({ status: event.target.value as ModelTestStatus })
            }
            className={cn(selectClassName, "h-8 w-[130px] pl-6")}
            aria-label="Suite status"
          >
            <option value="draft">Draft</option>
            <option value="running">Running</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-6">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Done
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {completion}%
            </span>
          </div>
          <div className="h-1.5 w-36 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${completion}%` }}
            />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {resultCount}/{expectedResults} results
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!canWrite || busy}
          onClick={onDeleteSuite}
          aria-label={`Delete ${selectedSuite.title}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
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
    <div className="flex items-start gap-1">
      <div className="min-w-0 flex-1">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          disabled={!canWrite || busy}
          aria-label={`${model.name} name`}
          className={cn(inlineFieldClassName, "h-7 text-sm font-medium")}
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
          className={cn(
            inlineFieldClassName,
            "h-6 font-mono text-xs text-muted-foreground",
          )}
        />
      </div>
      {canWrite && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/col:opacity-100 group-focus-within/col:opacity-100">
          {dirty && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={busy || !name.trim()}
              onClick={save}
              aria-label={`Save ${model.name}`}
            >
              <Save className="size-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={busy}
            onClick={onRemove}
            aria-label={`Remove ${model.name} from suite`}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}
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
    <div className="space-y-2 rounded-lg border border-dashed bg-muted/20 p-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Add model
      </div>
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
          className="h-8"
        />
        <div className="flex gap-2">
          <Input
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            placeholder="Provider"
            disabled={!canWrite || busy}
            aria-label="New model provider"
            className="h-8 font-mono text-xs"
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
        <div className="flex gap-2 border-t border-dashed pt-2">
          <select
            value={existingModelId}
            onChange={(event) => setExistingModelId(event.target.value)}
            disabled={!canWrite || busy}
            className={cn(selectClassName, "min-w-0 flex-1 text-xs")}
            aria-label="Existing model"
          >
            <option value="">From library…</option>
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
      <td colSpan={columnCount} className="bg-muted/25 p-3">
        <form
          className="grid gap-2 lg:grid-cols-[minmax(160px,0.6fr)_minmax(200px,0.7fr)_minmax(240px,1fr)_minmax(200px,0.85fr)_auto]"
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
            className={cn(selectClassName, "h-9")}
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
            <option value="">Import prompt…</option>
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
            className="min-h-9 resize-y"
            disabled={!canWrite || busy}
            aria-label="Prompt or task"
          />
          <Textarea
            value={expectedOutcome}
            onChange={(event) => setExpectedOutcome(event.target.value)}
            placeholder="Expected outcome"
            className="min-h-9 resize-y"
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
  index,
  challenge,
  canWrite,
  busy,
  onDelete,
  onUpdate,
}: {
  index: number;
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
          className="font-medium"
        />
        <Textarea
          value={promptText}
          onChange={(event) => setPromptText(event.target.value)}
          placeholder="Prompt or task"
          className="min-h-20"
          disabled={busy}
        />
        <Textarea
          value={expectedOutcome}
          onChange={(event) => setExpectedOutcome(event.target.value)}
          placeholder="Expected outcome"
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
            <Save className="size-3.5" />
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
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 gap-2.5">
        <span className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div className="font-medium leading-snug">{challenge.title}</div>
          {challenge.promptText && (
            <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
              {challenge.promptText}
            </p>
          )}
          {challenge.expectedOutcome && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground/80">
              <span className="font-medium text-muted-foreground">Expected: </span>
              {challenge.expectedOutcome}
            </p>
          )}
        </div>
      </div>
      {canWrite && (
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
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
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
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
  const fraction = score ? Math.max(0, Math.min(1, score / 5)) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-semibold leading-none tabular-nums">
            {score ? score.toFixed(1) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">/5</span>
        </div>
        <div className="flex items-center gap-1.5 pt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {formatDuration(result.durationSeconds)}
          </span>
          <span className="text-border">·</span>
          <span>{result.shots ?? 0}×</span>
        </div>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 border-t pt-2">
        {RUBRIC_ITEMS.map((item) => (
          <div key={item.key} className="text-center">
            <div className="font-mono text-sm font-medium leading-none tabular-nums">
              {result[item.key] ?? "—"}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              {item.shortLabel}
            </div>
          </div>
        ))}
      </div>

      {(result.positives.length > 0 ||
        result.negatives.length > 0 ||
        attachmentCount > 0) && (
        <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
          {result.positives.length > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">
              +{result.positives.length}
            </span>
          )}
          {result.negatives.length > 0 && (
            <span className="text-destructive">
              −{result.negatives.length}
            </span>
          )}
          {attachmentCount > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
              <ImageIcon className="size-3" />
              {attachmentCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
