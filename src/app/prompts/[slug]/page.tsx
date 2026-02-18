import { redirect } from "next/navigation";
import { getPromptBySlug, getAllPrompts } from "@/lib/prompts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPrompts().map((p) => ({ slug: p.slug }));
}

export default async function PromptPage({ params }: PageProps) {
  const { slug } = await params;
  const prompt = getPromptBySlug(slug);

  if (!prompt) {
    redirect("/prompts");
  }

  redirect(`/prompts/${slug}/${prompt.versions[0].version}`);
}
