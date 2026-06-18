"use client";

import dynamic from "next/dynamic";
import { LocalModelTestBoard } from "@/components/model-tests/local-board";
import type { TestPrompt } from "@/components/model-tests/types";

const hasConvex = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
const ConvexModelTestBoard = dynamic(() =>
  import("@/components/model-tests/convex-board").then(
    (module) => module.ConvexModelTestBoard,
  ),
);

type Props = {
  systemPrompts: TestPrompt[];
};

export function ModelTestBoard({ systemPrompts }: Props) {
  if (hasConvex) {
    return <ConvexModelTestBoard systemPrompts={systemPrompts} />;
  }

  return <LocalModelTestBoard systemPrompts={systemPrompts} />;
}
