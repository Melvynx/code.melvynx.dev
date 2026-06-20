"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelTestStatus } from "@/lib/model-tests";
import { AdminPanel } from "./panels";
import { useBoard } from "./board-context";

export const STATUS_META: Record<
  ModelTestStatus,
  { label: string; dot: string }
> = {
  draft: { label: "Draft", dot: "bg-muted-foreground/40" },
  running: { label: "Running", dot: "bg-amber-500" },
  complete: { label: "Complete", dot: "bg-emerald-500" },
};

export function StatusDot({ status }: { status: ModelTestStatus }) {
  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", STATUS_META[status].dot)}
      aria-hidden
    />
  );
}

export function BoardHeader({ left }: { left: React.ReactNode }) {
  const { actions, notice, setNotice } = useBoard();

  return (
    <>
      <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">{left}</div>

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
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <X className="mt-0.5 size-4 shrink-0" />
          <span>{notice.message}</span>
        </div>
      )}
    </>
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
