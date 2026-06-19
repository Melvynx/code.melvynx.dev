"use client";

import { useState } from "react";
import { KeyRound, Loader2, Lock, Plus, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BoardActions } from "./types";

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
      <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-2.5 text-xs font-medium">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Editable
      </span>
    );
  }

  if (actions.isAdmin) {
    return (
      <Button variant="outline" size="sm" onClick={actions.logout}>
        <Lock className="size-4" />
        Lock
      </Button>
    );
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
          await actions.login(password);
          setPassword("");
        } catch (error) {
          onNotice({
            kind: "error",
            message: error instanceof Error ? error.message : "Login failed.",
          });
        } finally {
          setLoading(false);
        }
      }}
    >
      <Input
        id="model-test-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder={actions.passwordConfigured ? "Password" : "No password set"}
        aria-label="Convex write password"
        disabled={!actions.passwordConfigured || loading}
        className="h-8 w-40"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!password || !actions.passwordConfigured || loading}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound />}
        Unlock
      </Button>
    </form>
  );
}

export function LoadingState() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card motion-safe:animate-pulse">
      <div className="flex items-center justify-between gap-4 border-b bg-muted/30 p-4">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-7 w-56 rounded bg-muted" />
        </div>
        <div className="h-9 w-40 rounded bg-muted" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, row) => (
          <div key={row} className="grid grid-cols-[280px_1fr_1fr] gap-3">
            <div className="h-24 rounded-lg bg-muted/70" />
            <div className="h-24 rounded-lg bg-muted/50" />
            <div className="h-24 rounded-lg bg-muted/50" />
          </div>
        ))}
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
    <div className="flex min-h-96 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-lg border bg-muted/40">
        <Table2 className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">No test suite yet</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Create a suite, add models as columns and challenges as rows, then record
        a result in every cell.
      </p>
      <Button className="mt-5" disabled={!canWrite || busy} onClick={onSeed}>
        <Plus className="size-4" />
        Create test suite
      </Button>
    </div>
  );
}
