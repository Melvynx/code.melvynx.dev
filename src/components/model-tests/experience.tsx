"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Database, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  resultKey,
  type ModelTestAttachment,
  type ModelTestChallenge,
  type ModelTestModel,
  type ModelTestResult,
  type ModelTestWorkspace,
} from "@/lib/model-tests";
import { AdminPanel, ChallengeComposer, EmptyState, LoadingState, ModelLibraryPanel, SuiteDetailPanel, SuitePanel } from "./panels";
import { ResultsMatrix } from "./matrix";
import { SummaryPanel } from "./summary";
import { ResultDialog } from "./result-dialog";
import type { BoardActions, TestPrompt } from "./types";

export function ModelTestExperience({
  systemPrompts,
  workspace,
  isLoading,
  actions,
}: {
  systemPrompts: TestPrompt[];
  workspace: ModelTestWorkspace;
  isLoading: boolean;
  actions: BoardActions;
}) {
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [editingResult, setEditingResult] = useState<{
    challenge: ModelTestChallenge;
    model: ModelTestModel;
    result?: ModelTestResult;
  } | null>(null);
  const [notice, setNotice] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (
      selectedSuiteId &&
      workspace.suites.some((suite) => suite._id === selectedSuiteId)
    ) {
      return;
    }
    setSelectedSuiteId(workspace.suites[0]?._id ?? null);
  }, [selectedSuiteId, workspace.suites]);

  const selectedSuite = workspace.suites.find(
    (suite) => suite._id === selectedSuiteId,
  );
  const suiteModelLinks = useMemo(
    () =>
      selectedSuite
        ? workspace.suiteModels
            .filter((link) => link.suiteId === selectedSuite._id)
            .sort((a, b) => a.order - b.order)
        : [],
    [selectedSuite, workspace.suiteModels],
  );
  const selectedModels = suiteModelLinks
    .map((link) => workspace.models.find((model) => model._id === link.modelId))
    .filter((model): model is ModelTestModel => Boolean(model));
  const challenges = selectedSuite
    ? workspace.challenges
        .filter((challenge) => challenge.suiteId === selectedSuite._id)
        .sort((a, b) => a.order - b.order)
    : [];
  const resultsByKey = new Map(
    workspace.results.map((result) => [
      resultKey(result.challengeId, result.modelId),
      result,
    ]),
  );
  const attachmentsByResult = useMemo(() => {
    const map = new Map<string, ModelTestAttachment[]>();
    for (const attachment of workspace.attachments) {
      map.set(attachment.resultId, [
        ...(map.get(attachment.resultId) ?? []),
        attachment,
      ]);
    }
    return map;
  }, [workspace.attachments]);
  const canWrite = !actions.adminRequired || actions.isAdmin;

  async function run(
    task: () => Promise<void>,
    successMessage?: string,
  ): Promise<void> {
    void successMessage;
    setBusy(true);
    setNotice(null);
    try {
      await task();
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error ? error.message : "The action could not run.",
      });
    } finally {
      setBusy(false);
    }
  }

  const selectedChallengeIds = new Set(
    challenges.map((challenge) => challenge._id),
  );
  const selectedModelIds = new Set(selectedModels.map((model) => model._id));
  const completedResults = selectedSuite
    ? workspace.results.filter((result) => result.suiteId === selectedSuite._id)
        .filter(
          (result) =>
            selectedChallengeIds.has(result.challengeId) &&
            selectedModelIds.has(result.modelId),
        )
    : [];
  const expectedResults = challenges.length * selectedModels.length;
  const completion =
    expectedResults > 0
      ? Math.round((completedResults.length / expectedResults) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Model tests</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusIcon
            active={actions.mode === "convex"}
            label={actions.mode === "convex" ? "Convex connected" : "Local mode"}
            icon={<Database className="size-3.5" />}
          />
          <StatusIcon
            active={actions.uploadsConfigured}
            label={
              actions.uploadsConfigured
                ? "Image uploads enabled"
                : "Image uploads unavailable"
            }
            icon={<Camera className="size-3.5" />}
          />
          <AdminPanel actions={actions} onNotice={setNotice} />
        </div>
      </header>

      {notice?.kind === "error" && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
            "border-destructive/30 bg-destructive/5 text-destructive",
          )}
        >
          <X className="mt-0.5 size-4 shrink-0" />
          <span>{notice.message}</span>
        </div>
      )}

      {isLoading ? (
        <LoadingState />
      ) : workspace.suites.length === 0 ? (
        <EmptyState
          canWrite={canWrite}
          busy={busy}
          onSeed={() =>
            run(async () => {
              const suiteId = await actions.seedStarterSuite();
              if (suiteId) setSelectedSuiteId(String(suiteId));
            }, "Starter suite created.")
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <SuitePanel
              workspace={workspace}
              selectedSuiteId={selectedSuiteId}
              canWrite={canWrite}
              busy={busy}
              onSelect={setSelectedSuiteId}
              onCreate={(input) =>
                run(async () => {
                  const suiteId = await actions.createSuite(input);
                  if (suiteId) setSelectedSuiteId(String(suiteId));
                }, "Suite created.")
              }
              onDelete={(suiteId) =>
                run(
                  async () => actions.deleteSuite(suiteId),
                  "Suite deleted.",
                )
              }
            />
            <ModelLibraryPanel
              models={workspace.models}
              selectedModelIds={selectedModels.map((model) => model._id)}
              canWrite={canWrite}
              busy={busy}
              onCreate={(input) =>
                run(
                  async () => actions.createModel(input),
                  "Model added to library.",
                )
              }
              onDelete={(modelId) =>
                run(
                  async () => actions.deleteModel(modelId),
                  "Model deleted.",
                )
              }
            />
          </aside>

          <main className="min-w-0 space-y-5">
            {selectedSuite ? (
              <>
                <SuiteDetailPanel
                  key={selectedSuite._id}
                  suite={selectedSuite}
                  models={workspace.models}
                  selectedModels={selectedModels}
                  suiteModelIds={selectedModels.map((model) => model._id)}
                  canWrite={canWrite}
                  busy={busy}
                  completion={completion}
                  challengeCount={challenges.length}
                  resultCount={completedResults.length}
                  onUpdate={(input) =>
                    run(
                      async () => actions.updateSuite(selectedSuite._id, input),
                      "Suite updated.",
                    )
                  }
                  onSetModels={(modelIds) =>
                    run(
                      async () =>
                        actions.setSuiteModels(selectedSuite._id, modelIds),
                      "Suite models updated.",
                    )
                  }
                />
                <ChallengeComposer
                  suiteId={selectedSuite._id}
                  systemPrompts={systemPrompts}
                  canWrite={canWrite}
                  busy={busy}
                  onCreate={(input) =>
                    run(
                      async () => actions.createChallenge(input),
                      "Challenge added.",
                    )
                  }
                />
                <ResultsMatrix
                  selectedModels={selectedModels}
                  challenges={challenges}
                  resultsByKey={resultsByKey}
                  attachmentsByResult={attachmentsByResult}
                  canWrite={canWrite}
                  busy={busy}
                  onEdit={(challenge, model, result) =>
                    setEditingResult({ challenge, model, result })
                  }
                  onDeleteChallenge={(challengeId) =>
                    run(
                      async () => actions.deleteChallenge(challengeId),
                      "Challenge deleted.",
                    )
                  }
                  onUpdateChallenge={(challengeId, input) =>
                    run(
                      async () =>
                        actions.updateChallenge(challengeId, input),
                      "Challenge updated.",
                    )
                  }
                />
                <SummaryPanel
                  suite={selectedSuite}
                  selectedModels={selectedModels}
                  challenges={challenges}
                  results={completedResults}
                />
              </>
            ) : null}
          </main>
        </div>
      )}

      <ResultDialog
        editing={editingResult}
        attachments={
          editingResult?.result
            ? attachmentsByResult.get(editingResult.result._id) ?? []
            : []
        }
        canWrite={canWrite}
        busy={busy}
        uploadsConfigured={actions.uploadsConfigured}
        onClose={() => setEditingResult(null)}
        onSave={(input, files) =>
          run(async () => {
            await actions.saveResult(input, files);
            setEditingResult(null);
          }, "Result saved.")
        }
        onDelete={(resultId) =>
          run(async () => {
            await actions.deleteResult(resultId);
            setEditingResult(null);
          }, "Result deleted.")
        }
        onRemoveAttachment={(attachmentId) =>
          run(
            async () => actions.removeAttachment(attachmentId),
            "Shot removed.",
          )
        }
      />
    </div>
  );
}

function StatusIcon({
  active,
  label,
  icon,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border transition-colors",
        active
          ? "border-border bg-muted text-foreground"
          : "border-dashed text-muted-foreground",
      )}
    >
      {icon}
    </span>
  );
}
