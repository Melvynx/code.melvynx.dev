"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  resultKey,
  type ModelTestAttachment,
  type ModelTestChallenge,
  type ModelTestModel,
  type ModelTestResult,
  type ModelTestWorkspace,
} from "@/lib/model-tests";
import { AdminPanel, EmptyState, LoadingState } from "./panels";
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
  const selectedModelIds = new Set(selectedModels.map((model) => model._id));
  const availableModels = workspace.models.filter(
    (model) => !selectedModelIds.has(model._id),
  );
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
        <h1 className="text-2xl font-semibold tracking-tight">Model tests</h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border bg-card p-0.5">
            <StatusPill
              active={actions.mode === "convex"}
              label={actions.mode === "convex" ? "Convex" : "Local"}
            />
            <span className="h-4 w-px bg-border" />
            <StatusPill
              active={actions.uploadsConfigured}
              label={actions.uploadsConfigured ? "Uploads" : "No uploads"}
            />
          </div>
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
            }, "Suite created.")
          }
        />
      ) : (
        <main className="min-w-0 space-y-5">
          {selectedSuite ? (
            <>
              <ResultsMatrix
                suites={workspace.suites}
                selectedSuite={selectedSuite}
                selectedModels={selectedModels}
                availableModels={availableModels}
                challenges={challenges}
                systemPrompts={systemPrompts}
                resultsByKey={resultsByKey}
                attachmentsByResult={attachmentsByResult}
                canWrite={canWrite}
                busy={busy}
                completion={completion}
                resultCount={completedResults.length}
                onSelectSuite={setSelectedSuiteId}
                onCreateSuite={() =>
                  run(async () => {
                    const suiteId = await actions.createSuite({
                      title: "Untitled model test",
                    });
                    if (suiteId) setSelectedSuiteId(String(suiteId));
                  }, "Suite created.")
                }
                onDeleteSuite={() =>
                  run(async () => {
                    await actions.deleteSuite(selectedSuite._id);
                    const nextSuite = workspace.suites.find(
                      (suite) => suite._id !== selectedSuite._id,
                    );
                    setSelectedSuiteId(nextSuite?._id ?? null);
                  }, "Suite deleted.")
                }
                onUpdateSuite={(input) =>
                  run(
                    async () => actions.updateSuite(selectedSuite._id, input),
                    "Suite updated.",
                  )
                }
                onCreateModel={(input) =>
                  run(async () => {
                    const modelId = await actions.createModel(input);
                    if (!modelId) return;
                    await actions.setSuiteModels(selectedSuite._id, [
                      ...selectedModels.map((model) => model._id),
                      String(modelId),
                    ]);
                  }, "Model added.")
                }
                onUpdateModel={(modelId, input) =>
                  run(
                    async () => actions.updateModel(modelId, input),
                    "Model updated.",
                  )
                }
                onRemoveModel={(modelId) =>
                  run(async () => {
                    await actions.setSuiteModels(
                      selectedSuite._id,
                      selectedModels
                        .map((model) => model._id)
                        .filter((id) => id !== modelId),
                    );
                  }, "Model removed.")
                }
                onAddExistingModel={(modelId) =>
                  run(async () => {
                    await actions.setSuiteModels(selectedSuite._id, [
                      ...selectedModels.map((model) => model._id),
                      modelId,
                    ]);
                  }, "Model added.")
                }
                onCreateChallenge={(input) =>
                  run(
                    async () =>
                      actions.createChallenge({
                        suiteId: selectedSuite._id,
                        ...input,
                      }),
                    "Challenge added.",
                  )
                }
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
                    async () => actions.updateChallenge(challengeId, input),
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

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium">
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/40",
        )}
      />
      <span className={active ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </span>
  );
}
