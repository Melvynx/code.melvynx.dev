"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  resultKey,
  type ModelTestAttachment,
  type ModelTestChallenge,
  type ModelTestModel,
  type ModelTestResult,
} from "@/lib/model-tests";
import { BoardHeader } from "./board-header";
import { useBoard } from "./board-context";
import { LoadingState } from "./panels";
import { ResultsMatrix } from "./matrix";
import { SummaryPanel } from "./summary";
import { ResultDialog } from "./result-dialog";

const backLink = (
  <Link
    href="/prompts/test"
    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
  >
    <ArrowLeft className="size-4" />
    All suites
  </Link>
);

export function ModelTestExperience({ suiteId }: { suiteId: string }) {
  const { systemPrompts, workspace, isLoading, actions, busy, run } = useBoard();
  const router = useRouter();
  const [editingResult, setEditingResult] = useState<{
    challenge: ModelTestChallenge;
    model: ModelTestModel;
    result?: ModelTestResult;
  } | null>(null);

  const selectedSuite = workspace.suites.find((suite) => suite._id === suiteId);

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

  const selectedChallengeIds = new Set(
    challenges.map((challenge) => challenge._id),
  );
  const completedResults = selectedSuite
    ? workspace.results
        .filter((result) => result.suiteId === selectedSuite._id)
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
      <BoardHeader left={backLink} />

      {isLoading ? (
        <LoadingState />
      ) : !selectedSuite ? (
        <SuiteNotFound />
      ) : (
        <main className="min-w-0 space-y-5">
          <ResultsMatrix
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
            onDeleteSuite={() =>
              run(async () => {
                await actions.deleteSuite(selectedSuite._id);
                router.push("/prompts/test");
              })
            }
            onUpdateSuite={(input) =>
              run(async () => actions.updateSuite(selectedSuite._id, input))
            }
            onCreateModel={(input) =>
              run(async () => {
                const modelId = await actions.createModel(input);
                if (!modelId) return;
                await actions.setSuiteModels(selectedSuite._id, [
                  ...selectedModels.map((model) => model._id),
                  String(modelId),
                ]);
              })
            }
            onUpdateModel={(modelId, input) =>
              run(async () => actions.updateModel(modelId, input))
            }
            onRemoveModel={(modelId) =>
              run(async () =>
                actions.setSuiteModels(
                  selectedSuite._id,
                  selectedModels
                    .map((model) => model._id)
                    .filter((id) => id !== modelId),
                ),
              )
            }
            onAddExistingModel={(modelId) =>
              run(async () =>
                actions.setSuiteModels(selectedSuite._id, [
                  ...selectedModels.map((model) => model._id),
                  modelId,
                ]),
              )
            }
            onCreateChallenge={(input) =>
              run(async () =>
                actions.createChallenge({
                  suiteId: selectedSuite._id,
                  ...input,
                }),
              )
            }
            onEdit={(challenge, model, result) =>
              setEditingResult({ challenge, model, result })
            }
            onDeleteChallenge={(challengeId) =>
              run(async () => actions.deleteChallenge(challengeId))
            }
            onUpdateChallenge={(challengeId, input) =>
              run(async () => actions.updateChallenge(challengeId, input))
            }
          />
          <SummaryPanel
            suite={selectedSuite}
            selectedModels={selectedModels}
            challenges={challenges}
            results={completedResults}
          />
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
          })
        }
        onDelete={(resultId) =>
          run(async () => {
            await actions.deleteResult(resultId);
            setEditingResult(null);
          })
        }
        onRemoveAttachment={(attachmentId) =>
          run(async () => actions.removeAttachment(attachmentId))
        }
      />
    </div>
  );
}

function SuiteNotFound() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <h2 className="text-lg font-semibold tracking-tight">Suite not found</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        This test suite no longer exists or has not loaded yet.
      </p>
      <Link
        href="/prompts/test"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to all suites
      </Link>
    </div>
  );
}
