"use client";

import { formatDuration, scoreResult, type ModelTestChallenge, type ModelTestModel, type ModelTestResult, type ModelTestSuite } from "@/lib/model-tests";

export function SummaryPanel({
  suite,
  selectedModels,
  challenges,
  results,
}: {
  suite: ModelTestSuite;
  selectedModels: ModelTestModel[];
  challenges: ModelTestChallenge[];
  results: ModelTestResult[];
}) {
  const rows = selectedModels
    .map((model) => {
      const modelResults = results.filter((result) => result.modelId === model._id);
      const scores = modelResults
        .map((result) => scoreResult(result))
        .filter((score): score is number => score !== null);
      const average =
        scores.length > 0
          ? scores.reduce((total, score) => total + score, 0) / scores.length
          : null;
      const durations = modelResults
        .map((result) => result.durationSeconds)
        .filter((value): value is number => typeof value === "number");
      const averageDuration =
        durations.length > 0
          ? durations.reduce((total, value) => total + value, 0) /
            durations.length
          : undefined;

      return {
        model,
        average,
        averageDuration,
        completed: modelResults.length,
        shots: modelResults.reduce((total, result) => total + (result.shots ?? 0), 0),
      };
    })
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

  return (
    <section className="rounded-lg border p-4">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="font-semibold">Summary: {suite.title}</h2>
        <p className="text-sm text-muted-foreground">
          Ranking uses the average of code quality, prompt feature, and
          reliability across completed challenge results.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Select models to see a summary.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.model._id}
              className="grid gap-3 rounded-md border px-3 py-3 sm:grid-cols-[36px_minmax(0,1fr)_120px_120px_90px]"
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{row.model.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.model.provider || "No provider"}
                </div>
              </div>
              <SummaryValue
                label="Average"
                value={row.average ? `${row.average.toFixed(2)}/5` : "-"}
              />
              <SummaryValue
                label="Time"
                value={formatDuration(row.averageDuration)}
              />
              <SummaryValue
                label="Done"
                value={`${row.completed}/${challenges.length}`}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-medium">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
