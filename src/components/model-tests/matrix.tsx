"use client";

import { useState } from "react";
import { Clock, FileImage, ListChecks, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RUBRIC_ITEMS, formatDuration, resultKey, scoreResult, type ModelTestAttachment, type ModelTestChallenge, type ModelTestModel, type ModelTestResult } from "@/lib/model-tests";
import { cn } from "@/lib/utils";
import { compactText } from "./utils";

export function ResultsMatrix({
  selectedModels,
  challenges,
  resultsByKey,
  attachmentsByResult,
  canWrite,
  busy,
  onEdit,
  onDeleteChallenge,
  onUpdateChallenge,
}: {
  selectedModels: ModelTestModel[];
  challenges: ModelTestChallenge[];
  resultsByKey: Map<string, ModelTestResult>;
  attachmentsByResult: Map<string, ModelTestAttachment[]>;
  canWrite: boolean;
  busy: boolean;
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
  if (selectedModels.length === 0 || challenges.length === 0) {
    return (
      <section className="rounded-lg border border-dashed p-8 text-center">
        <ListChecks className="mx-auto mb-3 size-7 text-muted-foreground" />
        <h2 className="font-semibold">Add models and challenges</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select at least one model and add one challenge to start recording
          results.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="border-b p-4">
        <h2 className="font-semibold">Challenge matrix</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each cell stores time, shots, rubric scores, findings, notes, and
          screenshots.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 w-[280px] border-r bg-muted px-4 py-3 text-left font-medium">
                Challenge
              </th>
              {selectedModels.map((model) => (
                <th
                  key={model._id}
                  className="min-w-[210px] border-r px-4 py-3 text-left align-top font-medium last:border-r-0"
                >
                  <div>{model.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {model.provider || "Model"}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {challenges.map((challenge) => (
              <tr key={challenge._id} className="border-b last:border-b-0">
                <td className="sticky left-0 z-10 border-r bg-background p-4 align-top">
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
                    <td key={model._id} className="border-r p-3 last:border-r-0">
                      <button
                        type="button"
                        disabled={!canWrite}
                        onClick={() => onEdit(challenge, model, result)}
                        className={cn(
                          "min-h-32 w-full rounded-md border p-3 text-left transition-colors",
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
                          <div className="flex h-full min-h-24 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                            <Pencil className="size-4" />
                            <span className="text-xs">Add result</span>
                          </div>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
            disabled={busy || !title.trim()}
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
            onClick={() => setEditing(false)}
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
              Expected: {challenge.expectedOutcome}
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
