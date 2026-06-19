"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, scoreResult, type ModelTestChallenge, type ModelTestModel, type ModelTestResult, type ModelTestSuite } from "@/lib/model-tests";

export function SummaryPanel({
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

  const topAverage = rows[0]?.average ?? null;

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">Ranking</h2>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {rows.length} models · {challenges.length} challenges
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Add a model to start ranking.
        </p>
      ) : (
        <ol className="divide-y">
          {rows.map((row, index) => {
            const fraction = row.average ? Math.max(0, Math.min(1, row.average / 5)) : 0;
            const isLeader = index === 0 && row.average !== null && row.average === topAverage;

            return (
              <li
                key={row.model._id}
                className="grid items-center gap-3 px-4 py-3 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(140px,200px)_88px_72px]"
              >
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md font-mono text-xs font-semibold tabular-nums",
                    isLeader
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isLeader ? <Trophy className="size-3.5" /> : index + 1}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{row.model.name}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">
                    {row.model.provider || "No provider"}
                  </div>
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${fraction * 100}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">
                    {row.average ? row.average.toFixed(2) : "—"}
                  </span>
                </div>

                <SummaryValue label="Time" value={formatDuration(row.averageDuration)} />
                <SummaryValue
                  label="Done"
                  value={`${row.completed}/${challenges.length}`}
                />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="font-mono text-sm tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
