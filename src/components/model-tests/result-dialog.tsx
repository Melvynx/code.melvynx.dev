"use client";

import { useState } from "react";
import { Camera, FileImage, Loader2, Minus, Plus, Save, Trash2, Upload, X } from "lucide-react";
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {editing.model.name}: {editing.challenge.title}
          </DialogTitle>
          <DialogDescription>
            Score the result, record evidence, and attach final shots.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="result-duration" className="text-sm font-medium">
                Time spent
              </label>
              <Input
                id="result-duration"
                type="number"
                min="0"
                step="0.1"
                value={durationSeconds}
                onChange={(event) => setDurationSeconds(event.target.value)}
                placeholder="Seconds"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="result-shots" className="text-sm font-medium">
                Shots
              </label>
              <Input
                id="result-shots"
                type="number"
                min="1"
                step="1"
                value={shots}
                onChange={(event) => setShots(event.target.value)}
                placeholder="Attempts"
                disabled={disabled}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <RubricSlider
              value={codeQuality}
              item={RUBRIC_ITEMS[0]}
              disabled={disabled}
              onChange={setCodeQuality}
            />
            <RubricSlider
              value={featureCoverage}
              item={RUBRIC_ITEMS[1]}
              disabled={disabled}
              onChange={setFeatureCoverage}
            />
            <RubricSlider
              value={reliability}
              item={RUBRIC_ITEMS[2]}
              disabled={disabled}
              onChange={setReliability}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FindingListEditor
              title="Positive points"
              values={positives}
              disabled={disabled}
              onChange={setPositives}
            />
            <FindingListEditor
              title="Negative points"
              values={negatives}
              disabled={disabled}
              onChange={setNegatives}
            />
          </div>

          <div>
            <label htmlFor="result-notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="result-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What happened during the test?"
              disabled={disabled}
              className="mt-1"
            />
          </div>

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

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {editing.result && (
              <Button
                type="button"
                variant="destructive"
                disabled={disabled}
                onClick={() => onDelete(editing.result!._id)}
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

function RubricSlider({
  item,
  value,
  disabled,
  onChange,
}: {
  item: (typeof RUBRIC_ITEMS)[number];
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <label htmlFor={item.key} className="text-sm font-medium">
            {item.label}
          </label>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          {value}
        </div>
      </div>
      <input
        id={item.key}
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full accent-primary"
      />
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>Weak</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

function FindingListEditor({
  title,
  values,
  disabled,
  onChange,
}: {
  title: string;
  values: string[];
  disabled: boolean;
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="space-y-2">
        {values.length === 0 ? (
          <p className="text-xs text-muted-foreground">No points yet.</p>
        ) : (
          values.map((value, index) => (
            <div key={`${value}-${index}`} className="flex items-start gap-2">
              <Minus className="mt-1 size-3.5 text-muted-foreground" />
              <span className="min-w-0 flex-1 text-sm">{value}</span>
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
          placeholder="Add a point"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !draft.trim()}
          onClick={() => {
            onChange([...values, draft.trim()]);
            setDraft("");
          }}
        >
          <Plus className="size-4" />
          Add
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
    <div className="rounded-lg border p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">Shots</div>
          <p className="text-xs text-muted-foreground">
            Attach screenshots or generated output images for the result.
          </p>
        </div>
        {!uploadsConfigured && (
          <Badge variant="outline" className="gap-1.5">
            <Camera className="size-3" />
            R2 missing
          </Badge>
        )}
      </div>
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-5 text-center transition-colors",
          disabled || !uploadsConfigured
            ? "cursor-not-allowed opacity-60"
            : "hover:bg-muted/60",
        )}
      >
        <Upload className="mb-2 size-5 text-muted-foreground" />
        <span className="text-sm font-medium">Upload images</span>
        <span className="text-xs text-muted-foreground">
          PNG, JPG, GIF, or WebP up to the backend limit.
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
                  <FileImage className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {attachment.fileName}
                </div>
                <div className="text-xs text-muted-foreground">
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
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-md border p-2">
              <div className="flex size-12 items-center justify-center rounded bg-muted">
                <FileImage className="size-5 text-muted-foreground" />
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
