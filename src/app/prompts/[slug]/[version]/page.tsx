import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPromptBySlug, getPromptVersion, getAllPrompts } from "@/lib/prompts";
import { CopyMarkdownButton } from "@/components/copy-markdown-button";

interface PageProps {
  params: Promise<{ slug: string; version: string }>;
}

export async function generateStaticParams() {
  const params: { slug: string; version: string }[] = [];
  for (const prompt of getAllPrompts()) {
    for (const v of prompt.versions) {
      params.push({ slug: prompt.slug, version: v.version });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, version } = await params;
  const prompt = getPromptBySlug(slug);
  if (!prompt) return { title: "Prompt not found" };
  return {
    title: `${prompt.name} ${version} | Testing Prompts`,
    description: prompt.description,
  };
}

export default async function PromptVersionPage({ params }: PageProps) {
  const { slug, version } = await params;

  const prompt = getPromptBySlug(slug);
  if (!prompt) notFound();

  const promptVersion = getPromptVersion(slug, version);
  if (!promptVersion) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/prompts"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Testing Prompts
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{prompt.name}</h1>
          <p className="text-muted-foreground mt-1">{prompt.description}</p>
        </div>
        <CopyMarkdownButton content={promptVersion.content} />
      </div>

      {prompt.versions.length > 1 && (
        <div className="flex gap-2 mb-6">
          {prompt.versions.map((v) => (
            <a
              key={v.version}
              href={`/prompts/${slug}/${v.version}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                v.version === version
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.version}
            </a>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-6">
        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/90 overflow-x-auto">
          {promptVersion.content}
        </pre>
      </div>
    </div>
  );
}
