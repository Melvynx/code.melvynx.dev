import { redirect } from "next/navigation";
import {
  getAllPrompts,
  getLatestPromptVersion,
  getPromptBySlug,
} from "@/lib/prompts";

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

  const latestVersion = getLatestPromptVersion(prompt);
  if (!latestVersion) {
    redirect("/prompts");
  }

  redirect(`/prompts/${slug}/${latestVersion}`);
}
