"use client";

import { useState } from "react";
import { BarChart3, ChevronRight, KeyRound, Loader2, Lock, Pencil, Plus, Save, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ModelTestModel, ModelTestStatus, ModelTestSuite, ModelTestWorkspace } from "@/lib/model-tests";
import type { BoardActions, TestPrompt } from "./types";
import { compactText } from "./utils";

export function ModeBadge({ actions }: { actions: BoardActions }) {
  if (actions.mode === "convex") {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <ShieldCheck className="size-3" />
        Convex persistence
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5">
      <Pencil className="size-3" />
      Local fallback
    </Badge>
  );
}

export function AdminPanel({
  actions,
  onNotice,
}: {
  actions: BoardActions;
  onNotice: (notice: { kind: "error" | "success"; message: string }) => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!actions.adminRequired) {
    return (
      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Local mode is editable without a password. Add
        <span className="font-medium text-foreground">
          {" "}
          NEXT_PUBLIC_CONVEX_URL
        </span>{" "}
        to switch to Convex persistence.
      </div>
    );
  }

  if (actions.isAdmin) {
    return (
      <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Lock className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">Write access unlocked</div>
          <p className="text-xs text-muted-foreground">
            Mutations and image uploads will use your password for this tab.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={actions.logout}>
          Lock
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex w-full flex-col gap-2 rounded-lg border p-3 sm:w-[360px]"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
          await actions.login(password);
          setPassword("");
          onNotice({ kind: "success", message: "Convex write access unlocked." });
        } catch (error) {
          onNotice({
            kind: "error",
            message:
              error instanceof Error ? error.message : "Login failed.",
          });
        } finally {
          setLoading(false);
        }
      }}
    >
      <label htmlFor="model-test-password" className="text-sm font-medium">
        Convex write password
      </label>
      <div className="flex gap-2">
        <Input
          id="model-test-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={
            actions.passwordConfigured ? "Password" : "Set env first"
          }
          disabled={!actions.passwordConfigured || loading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!password || !actions.passwordConfigured || loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound />}
          Unlock
        </Button>
      </div>
      {!actions.passwordConfigured && (
        <p className="text-xs text-destructive">
          Set MODEL_TEST_ADMIN_PASSWORD in Convex env before editing.
        </p>
      )}
    </form>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-lg border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading model tests
      </div>
    </div>
  );
}

export function EmptyState({
  canWrite,
  busy,
  onSeed,
}: {
  canWrite: boolean;
  busy: boolean;
  onSeed: () => void;
}) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-lg border bg-muted/40">
        <BarChart3 className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">No test suites yet</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Create a suite, add the models you want to compare, then add
        challenges and result evidence for each model.
      </p>
      <Button className="mt-5" disabled={!canWrite || busy} onClick={onSeed}>
        <Sparkles className="size-4" />
        Create starter comparison
      </Button>
    </div>
  );
}

export function SuitePanel({
  workspace,
  selectedSuiteId,
  canWrite,
  busy,
  onSelect,
  onCreate,
  onDelete,
}: {
  workspace: ModelTestWorkspace;
  selectedSuiteId: string | null;
  canWrite: boolean;
  busy: boolean;
  onSelect: (suiteId: string) => void;
  onCreate: (input: { title: string; description?: string }) => void;
  onDelete: (suiteId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <section className="rounded-lg border">
      <div className="border-b p-4">
        <h2 className="font-semibold">Suites</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A suite is one comparison, with its own models and challenges.
        </p>
      </div>
      <div className="max-h-[340px] overflow-y-auto p-2">
        {workspace.suites.map((suite) => (
          <button
            key={suite._id}
            type="button"
            onClick={() => onSelect(suite._id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
              selectedSuiteId === suite._id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <ChevronRight className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{suite.title}</span>
              <span className="block truncate text-xs">
                {suite.description || suite.status}
              </span>
            </span>
            {canWrite && selectedSuiteId === suite._id && (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Delete ${suite.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(suite._id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onDelete(suite._id);
                  }
                }}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </span>
            )}
          </button>
        ))}
      </div>
      <form
        className="space-y-3 border-t p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onCreate({ title, description: compactText(description) });
          setTitle("");
          setDescription("");
        }}
      >
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New suite name"
          disabled={!canWrite || busy}
        />
        <Input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short description"
          disabled={!canWrite || busy}
        />
        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={!canWrite || busy || !title.trim()}
        >
          <Plus className="size-4" />
          Create suite
        </Button>
      </form>
    </section>
  );
}

export function ModelLibraryPanel({
  models,
  selectedModelIds,
  canWrite,
  busy,
  onCreate,
  onDelete,
}: {
  models: ModelTestModel[];
  selectedModelIds: string[];
  canWrite: boolean;
  busy: boolean;
  onCreate: (input: { name: string; provider?: string; notes?: string }) => void;
  onDelete: (modelId: string) => void;
}) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");

  return (
    <section className="rounded-lg border">
      <div className="border-b p-4">
        <h2 className="font-semibold">Model library</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Add once, select per suite.
        </p>
      </div>
      <div className="max-h-[260px] space-y-2 overflow-y-auto p-3">
        {models.length === 0 ? (
          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            No models in the library.
          </p>
        ) : (
          models.map((model) => (
            <div
              key={model._id}
              className="flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{model.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {model.provider || "No provider"}
                </div>
              </div>
              {selectedModelIds.includes(model._id) && (
                <Badge variant="secondary">In suite</Badge>
              )}
              {canWrite && (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Delete ${model.name}`}
                  disabled={busy}
                  onClick={() => onDelete(model._id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
      <form
        className="space-y-3 border-t p-4"
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
        />
        <Input
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          placeholder="Provider"
          disabled={!canWrite || busy}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!canWrite || busy || !name.trim()}
        >
          <Plus className="size-4" />
          Add model
        </Button>
      </form>
    </section>
  );
}

export function SuiteDetailPanel({
  suite,
  models,
  suiteModelIds,
  canWrite,
  busy,
  completion,
  challengeCount,
  resultCount,
  onUpdate,
  onSetModels,
}: {
  suite: ModelTestSuite;
  models: ModelTestModel[];
  selectedModels: ModelTestModel[];
  suiteModelIds: string[];
  canWrite: boolean;
  busy: boolean;
  completion: number;
  challengeCount: number;
  resultCount: number;
  onUpdate: (input: {
    title?: string;
    description?: string;
    status?: ModelTestStatus;
  }) => void;
  onSetModels: (modelIds: string[]) => void;
}) {
  const [title, setTitle] = useState(suite.title);
  const [description, setDescription] = useState(suite.description ?? "");

  function toggleModel(modelId: string) {
    const next = suiteModelIds.includes(modelId)
      ? suiteModelIds.filter((id) => id !== modelId)
      : [...suiteModelIds, modelId];
    onSetModels(next);
  }

  return (
    <section className="rounded-lg border p-4">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="suite-title" className="text-sm font-medium">
                Suite name
              </label>
              <Input
                id="suite-title"
                className="mt-1"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={!canWrite || busy}
              />
            </div>
            <div>
              <label htmlFor="suite-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="suite-status"
                className="border-input bg-background mt-1 h-9 rounded-md border px-3 text-sm"
                value={suite.status}
                disabled={!canWrite || busy}
                onChange={(event) =>
                  onUpdate({ status: event.target.value as ModelTestStatus })
                }
              >
                <option value="draft">Draft</option>
                <option value="running">Running</option>
                <option value="complete">Complete</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="suite-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="suite-description"
              className="mt-1 min-h-20"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!canWrite || busy}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!canWrite || busy || !title.trim()}
            onClick={() =>
              onUpdate({
                title,
                description: compactText(description),
              })
            }
          >
            <Save className="size-4" />
            Save suite
          </Button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric value={`${completion}%`} label="Complete" />
            <Metric value={String(challengeCount)} label="Challenges" />
            <Metric value={String(resultCount)} label="Results" />
          </div>
          <div className="rounded-lg border p-3">
            <div className="mb-2 text-sm font-medium">Models in this suite</div>
            <div className="space-y-1.5">
              {models.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add models to the library first.
                </p>
              ) : (
                models.map((model) => (
                  <label
                    key={model._id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      checked={suiteModelIds.includes(model._id)}
                      disabled={!canWrite || busy}
                      onChange={() => toggleModel(model._id)}
                      className="size-4 accent-primary"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {model.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-2">
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

export function ChallengeComposer({
  suiteId,
  systemPrompts,
  canWrite,
  busy,
  onCreate,
}: {
  suiteId: string;
  systemPrompts: TestPrompt[];
  canWrite: boolean;
  busy: boolean;
  onCreate: (input: {
    suiteId: string;
    title: string;
    promptText?: string;
    expectedOutcome?: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");

  return (
    <section className="rounded-lg border p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Add challenge</h2>
          <p className="text-sm text-muted-foreground">
            A challenge is the thing every selected model must solve.
          </p>
        </div>
        {systemPrompts.length > 0 && (
          <select
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            defaultValue=""
            disabled={!canWrite || busy}
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
        )}
      </div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onCreate({
            suiteId,
            title,
            promptText: compactText(promptText),
            expectedOutcome: compactText(expectedOutcome),
          });
          setTitle("");
          setPromptText("");
          setExpectedOutcome("");
        }}
      >
        <div className="grid gap-3 lg:grid-cols-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Challenge name"
            disabled={!canWrite || busy}
          />
          <Textarea
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder="Prompt or task"
            className="min-h-16"
            disabled={!canWrite || busy}
          />
          <Textarea
            value={expectedOutcome}
            onChange={(event) => setExpectedOutcome(event.target.value)}
            placeholder="Expected outcome"
            className="min-h-16"
            disabled={!canWrite || busy}
          />
        </div>
        <Button
          type="submit"
          className="self-start"
          disabled={!canWrite || busy || !title.trim()}
        >
          <Plus className="size-4" />
          Add challenge
        </Button>
      </form>
    </section>
  );
}
