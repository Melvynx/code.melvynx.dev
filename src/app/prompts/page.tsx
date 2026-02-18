import Link from "next/link";
import { getAllPrompts } from "@/lib/prompts";
import { Badge } from "@/components/ui/badge";

export default function PromptsPage() {
  const prompts = getAllPrompts();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Testing Prompts</h1>
        <p className="text-muted-foreground mt-2">
          Prompts used to benchmark AI coding models.
        </p>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Link
            key={prompt.slug}
            href={`/prompts/${prompt.slug}/v1`}
            className="rounded-lg border p-5 hover:bg-muted/50 transition-colors block"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{prompt.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {prompt.description}
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {prompt.versions.map((v) => (
                  <Badge key={v.version} variant="secondary">
                    {v.version}
                  </Badge>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
