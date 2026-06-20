"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModelTestWorkspace } from "@/lib/model-tests";
import { BoardHeader, STATUS_META, StatusDot } from "./board-header";
import { useBoard } from "./board-context";
import { EmptyState } from "./panels";

function suiteStats(workspace: ModelTestWorkspace, suiteId: string) {
  const modelIds = new Set(
    workspace.suiteModels
      .filter((link) => link.suiteId === suiteId)
      .map((link) => link.modelId),
  );
  const challengeIds = new Set(
    workspace.challenges
      .filter((challenge) => challenge.suiteId === suiteId)
      .map((challenge) => challenge._id),
  );
  const done = workspace.results.filter(
    (result) =>
      result.suiteId === suiteId &&
      challengeIds.has(result.challengeId) &&
      modelIds.has(result.modelId),
  ).length;
  const expected = challengeIds.size * modelIds.size;

  return {
    models: modelIds.size,
    challenges: challengeIds.size,
    completion: expected > 0 ? Math.round((done / expected) * 100) : 0,
  };
}

export function SuiteListExperience() {
  const { workspace, isLoading, actions, busy, run } = useBoard();
  const router = useRouter();
  const canWrite = !actions.adminRequired || actions.isAdmin;

  const suites = [...workspace.suites].sort((a, b) => b.updatedAt - a.updatedAt);

  function createSuite() {
    void run(async () => {
      const suiteId = await actions.createSuite({
        title: "Untitled model test",
      });
      if (suiteId) router.push(`/prompts/test/${suiteId}`);
    });
  }

  return (
    <div className="space-y-6">
      <BoardHeader
        left={
          <h1 className="text-2xl font-semibold tracking-tight">Model tests</h1>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : suites.length === 0 ? (
        <EmptyState canWrite={canWrite} busy={busy} onSeed={createSuite} />
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {suites.length} {suites.length === 1 ? "suite" : "suites"}
            </p>
            <Button
              type="button"
              size="sm"
              disabled={!canWrite || busy}
              onClick={createSuite}
            >
              <Plus className="size-4" />
              New suite
            </Button>
          </div>

          <ul className="space-y-2">
            {suites.map((suite) => {
              const stats = suiteStats(workspace, suite._id);
              return (
                <li
                  key={suite._id}
                  className="group relative flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/30"
                >
                  <Link
                    href={`/prompts/test/${suite._id}`}
                    aria-label={`Open ${suite.title}`}
                    className="absolute inset-0 rounded-lg focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
                  />
                  <StatusDot status={suite.status} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{suite.title}</span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        {STATUS_META[suite.status].label}
                      </span>
                    </div>
                    {suite.description && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {suite.description}
                      </p>
                    )}
                  </div>

                  <div className="hidden items-center gap-5 sm:flex">
                    <Stat value={stats.models} label="Models" />
                    <Stat value={stats.challenges} label="Challenges" />
                    <div className="flex w-24 flex-col gap-1">
                      <span className="text-right font-mono text-sm font-semibold tabular-nums">
                        {stats.completion}%
                      </span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${stats.completion}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {canWrite && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={busy}
                      aria-label={`Delete ${suite.title}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void run(async () => actions.deleteSuite(suite._id));
                      }}
                      className="relative z-10 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/40" />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-right">
      <div className="font-mono text-sm font-medium tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2 motion-safe:animate-pulse">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-lg border bg-card p-4"
        >
          <div className="size-2 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted/70" />
          </div>
          <div className="h-8 w-24 rounded bg-muted/60" />
        </div>
      ))}
    </div>
  );
}
