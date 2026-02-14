import { getAllTools } from "@/lib/tools";
import { ToolCard } from "@/components/tool-card";

export default function Home() {
  const tools = getAllTools();

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="space-y-2 mb-16">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            AI Coding Tools
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore system prompts and documentation for the most powerful AI coding assistants
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </main>
  );
}
