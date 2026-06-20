"use client";

import dynamic from "next/dynamic";
import { LocalBoardProvider } from "@/components/model-tests/local-board";
import type { TestPrompt } from "@/components/model-tests/types";

const hasConvex = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
const ConvexBoardProvider = dynamic(() =>
  import("@/components/model-tests/convex-board").then(
    (module) => module.ConvexBoardProvider,
  ),
);

type Props = {
  systemPrompts: TestPrompt[];
  children: React.ReactNode;
};

export function BoardProvider({ systemPrompts, children }: Props) {
  if (hasConvex) {
    return (
      <ConvexBoardProvider systemPrompts={systemPrompts}>
        {children}
      </ConvexBoardProvider>
    );
  }

  return (
    <LocalBoardProvider systemPrompts={systemPrompts}>
      {children}
    </LocalBoardProvider>
  );
}
