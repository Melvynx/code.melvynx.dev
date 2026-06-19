"use client";

import { useState } from "react";
import { Camera, ImageIcon, Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RUBRIC_ITEMS, clampRating, type ModelTestAttachment, type ModelTestChallenge, type ModelTestModel, type ModelTestResult } from "@/lib/model-tests";
import { cn } from "@/lib/utils";
import type { ResultInput } from "./types";
import { compactText, parseOptionalNumber } from "./utils";

export function ResultDialog({
  editing,
  attachments,
  canWrite,
  busy,
  uploadsConfigured,
  onClose,
  onSave,
  onDelete,
  onRemoveAttachment,
}: {
  editing: {
    challenge: ModelTestChallenge;
    model: ModelTestModel;
    result?: ModelTestResult;
  } | null;
  attachments: ModelTestAttachment[];
  canWrite: boolean;
  busy: boolean;
  uploadsConfigured: boolean;
  onClose: () => void;
  onSave: (input: ResultInput, files: File[]) => void;
  onDelete: (resultId: string) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  if (!editing) return null;

  return (
    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && onClose()}>
      <ResultDialogEditor
        key={`${editing.challenge._id}-${editing.model._id}-${editing.result?._id ?? "new"}`}
        editing={editing}
        attachments={attachments}
        canWrite={canWrite}
        busy={busy}
        uploadsConfigured={uploadsConfigured}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
        onRemoveAttachment={onRemoveAttachment}
      />
    </Dialog>
  );
}

function ResultDialogEditor({
  editing,
  attachments,
  canWrite,
  busy,
  uploadsConfigured,
  onClose,
  onSave,
  onDelete,
  onRemoveAttachment,
}: {
  editing: {
    challenge: ModelTestChallenge;
    model: ModelTestModel;
    result?: ModelTestResult;
  };
  attachments: ModelTestAttachment[];
  canWrite: boolean;
  busy: boolean;
  uploadsConfigured: boolean;
  onClose: () => void;
  onSave: (input: ResultInput, files: File[]) => void;
  onDelete: (resultId: string) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  const result = editing.result;
  const [durationSeconds, setDurationSeconds] = useState(
    result?.durationSeconds?.toString() ?? "",
  );
  const [shots, setShots] = useState(result?.shots?.toString() ?? "");
  const [codeQuality, setCodeQuality] = useState(result?.codeQuality ?? 3);
  const [featureCoverage, setFeatureCoverage] = useState(
    result?.featureCoverage ?? 3,
  );
  const [reliability, setReliability] = useState(result?.reliability ?? 3);
  const [notes, setNotes] = useState(result?.notes ?? "");
  const [positives, setPositives] = useState<string[]>(result?.positives ?? []);
  const [negatives, setNegatives] = useState<string[]>(result?.negatives ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const disabled = !canWrite || busy;

  return (
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            {editing.model.name}
            {editing.model.provider && (
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {editing.model.provider}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>{editing.challenge.title}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-5">
          <FieldGroup label="Run">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="result-duration" className="text-xs font-medium text-muted-foreground">
                  Time spent (seconds)
                </label>
                <Input
                  id="result-duration"
                  type="number"
                  min="0"
                  step="0.1"
                  value={durationSeconds}
                  onChange={(event) => setDurationSeconds(event.target.value)}
                  placeholder="0"
                  disabled={disabled}
                  className="font-mono tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="result-shots" className="text-xs font-medium text-muted-foreground">
                  Shots
                </label>
                <Input
                  id="result-shots"
                  type="number"
                  min="1"
                  step="1"
                  value={shots}
                  onChange={(event) => setShots(event.target.value)}
                  placeholder="1"
                  disabled={disabled}
                  className="font-mono tabular-nums"
                />
              </div>
            </div>
          </FieldGroup>

          <FieldGroup label="Rubric">
            <div className="overflow-hidden rounded-lg border">
              <RubricRating
                value={codeQuality}
                item={RUBRIC_ITEMS[0]}
                disabled={disabled}
                onChange={setCodeQuality}
              />
              <RubricRating
                value={featureCoverage}
                item={RUBRIC_ITEMS[1]}
                disabled={disabled}
                onChange={setFeatureCoverage}
              />
              <RubricRating
                value={reliability}
                item={RUBRIC_ITEMS[2]}
                disabled={disabled}
                onChange={setReliability}
                last
              />
            </div>
          </FieldGroup>

          <div className="grid gap-4 md:grid-cols-2">
            <FindingListEditor
              title="Positive points"
              tone="positive"
              values={positives}
              disabled={disabled}
              onChange={setPositives}
            />
            <FindingListEditor
              title="Negative points"
              tone="negative"
              values={negatives}
              disabled={disabled}
              onChange={setNegatives}
            />
          </div>

          <FieldGroup label="Notes">
            <Textarea
              id="result-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What happened during the run?"
              disabled={disabled}
              className="min-h-20"
            />
          </FieldGroup>

          <ShotUploader
            attachments={attachments}
            files={files}
            disabled={disabled}
            uploadsConfigured={uploadsConfigured}
            onAddFiles={(nextFiles) => setFiles((current) => [...current, ...nextFiles])}
            onRemovePending={(index) =>
              setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
            }
            onRemoveAttachment={onRemoveAttachment}
          />
        </div>

        <DialogFooter className="gap-2 border-t px-6 py-4 sm:justify-between">
          <div>
            {editing.result && (
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                onClick={() => onDelete(editing.result!._id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete result
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={disabled}
              onClick={() =>
                onSave(
                  {
                    suiteId: editing.challenge.suiteId,
                    challengeId: editing.challenge._id,
                    modelId: editing.model._id,
                    durationSeconds: parseOptionalNumber(durationSeconds),
                    shots: parseOptionalNumber(shots),
                    codeQuality: clampRating(codeQuality),
                    featureCoverage: clampRating(featureCoverage),
                    reliability: clampRating(reliability),
                    notes: compactText(notes),
                    positives: positives.map((item) => item.trim()).filter(Boolean),
                    negatives: negatives.map((item) => item.trim()).filter(Boolean),
                  },
                  files,
                )
              }
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Save />}
              Save result
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function RubricRating({
  item,
  value,
  disabled,
  last,
  onChange,
}: {
  item: (typeof RUBRIC_ITEMS)[number];
  value: number;
  disabled: boolean;
  last?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between",
        !last && "border-b",
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium">{item.label}</div>
        <p className="text-xs text-muted-foreground">{item.description}</p>
      </div>
      <div
        role="radiogroup"
        aria-label={item.label}
        className="inline-flex shrink-0 self-start overflow-hidden rounded-md border sm:self-auto"
      >
        {[1, 2, 3, 4, 5].map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            aria-label={`${item.label}: ${option}`}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              "size-9 border-l font-mono text-sm tabular-nums transition-colors first:border-l-0 focus-visible:relative focus-visible:z-10 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
              value === option
                ? "bg-primary font-semibold text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function FindingListEditor({
  title,
  tone,
  values,
  disabled,
  onChange,
}: {
  title: string;
  tone: "positive" | "negative";
  values: string[];
  disabled: boolean;
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const marker =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-destructive";

  function commitDraft() {
    if (!draft.trim()) return;
    onChange([...values, draft.trim()]);
    setDraft("");
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {values.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {values.length === 0 ? (
          <p className="text-xs text-muted-foreground">No points yet.</p>
        ) : (
          values.map((value, index) => (
            <div key={`${value}-${index}`} className="flex items-start gap-2">
              <span className={cn("mt-px font-mono text-sm leading-5", marker)}>
                {tone === "positive" ? "+" : "−"}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-5">{value}</span>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                disabled={disabled}
                aria-label={`Remove ${value}`}
                onClick={() =>
                  onChange(values.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            }
          }}
          placeholder="Add a point"
          disabled={disabled}
          className="h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={disabled || !draft.trim()}
          aria-label={`Add ${tone} point`}
          onClick={commitDraft}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ShotUploader({
  attachments,
  files,
  disabled,
  uploadsConfigured,
  onAddFiles,
  onRemovePending,
  onRemoveAttachment,
}: {
  attachments: ModelTestAttachment[];
  files: File[];
  disabled: boolean;
  uploadsConfigured: boolean;
  onAddFiles: (files: File[]) => void;
  onRemovePending: (index: number) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Shots
        </span>
        {!uploadsConfigured && (
          <Badge variant="outline" className="gap-1.5">
            <Camera className="size-3" />
            R2 not configured
          </Badge>
        )}
      </div>
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center transition-colors",
          disabled || !uploadsConfigured
            ? "cursor-not-allowed opacity-60"
            : "hover:border-foreground/20 hover:bg-muted/40",
        )}
      >
        <Upload className="mb-2 size-5 text-muted-foreground" />
        <span className="text-sm font-medium">Upload screenshots</span>
        <span className="text-xs text-muted-foreground">
          PNG, JPG, GIF, or WebP
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          disabled={disabled || !uploadsConfigured}
          className="sr-only"
          onChange={(event) => {
            const nextFiles = Array.from(event.target.files ?? []);
            onAddFiles(nextFiles);
            event.target.value = "";
          }}
        />
      </label>

      {(attachments.length > 0 || files.length > 0) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <div key={attachment._id} className="flex items-center gap-2 rounded-md border p-2">
              {attachment.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.url}
                  alt={attachment.fileName}
                  className="size-12 rounded object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded bg-muted">
                  <ImageIcon className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {attachment.fileName}
                </div>
                <div className="font-mono text-xs tabular-nums text-muted-foreground">
                  {Math.round(attachment.size / 1024)} KB
                </div>
              </div>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                disabled={disabled}
                aria-label={`Remove ${attachment.fileName}`}
                onClick={() => onRemoveAttachment(attachment._id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-md border border-dashed p-2">
              <div className="flex size-12 items-center justify-center rounded bg-muted">
                <ImageIcon className="size-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  Pending upload
                </div>
              </div>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                onClick={() => onRemovePending(index)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
