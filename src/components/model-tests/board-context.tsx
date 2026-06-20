"use client";

import { createContext, useContext, useState } from "react";
import type { ModelTestWorkspace } from "@/lib/model-tests";
import type { BoardActions, TestPrompt } from "./types";

export type BoardNotice = { kind: "error" | "success"; message: string };

export type BoardContextValue = {
  systemPrompts: TestPrompt[];
  workspace: ModelTestWorkspace;
  isLoading: boolean;
  actions: BoardActions;
  busy: boolean;
  notice: BoardNotice | null;
  setNotice: (notice: BoardNotice | null) => void;
  run: (task: () => Promise<void>) => Promise<void>;
};

const BoardContext = createContext<BoardContextValue | null>(null);

export function useBoard() {
  const value = useContext(BoardContext);
  if (!value) {
    throw new Error("useBoard must be used within a board provider.");
  }
  return value;
}

function useBoardRunner() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<BoardNotice | null>(null);

  async function run(task: () => Promise<void>) {
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

  return { busy, notice, setNotice, run };
}

export function BoardProviderShell({
  systemPrompts,
  workspace,
  isLoading,
  actions,
  children,
}: {
  systemPrompts: TestPrompt[];
  workspace: ModelTestWorkspace;
  isLoading: boolean;
  actions: BoardActions;
  children: React.ReactNode;
}) {
  const runner = useBoardRunner();
  return (
    <BoardContext.Provider
      value={{ systemPrompts, workspace, isLoading, actions, ...runner }}
    >
      {children}
    </BoardContext.Provider>
  );
}
