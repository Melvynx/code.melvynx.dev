import { getAllPrompts } from "@/lib/prompts";
import { BoardProvider } from "@/components/model-test-board";

export default function ModelTestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const prompts = getAllPrompts();
  const systemPrompts = prompts.map((p) => ({
    id: p.slug,
    name: p.name,
    slug: p.slug,
    isCustom: false as const,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BoardProvider systemPrompts={systemPrompts}>{children}</BoardProvider>
    </div>
  );
}
