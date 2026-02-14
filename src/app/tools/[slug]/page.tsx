import { redirect } from "next/navigation";
import { getToolBySlug, getToolVersions, getAllToolSlugs } from "@/lib/tools";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllToolSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;

  const tool = getToolBySlug(slug);
  if (!tool) {
    redirect("/");
  }

  const versions = getToolVersions(slug);
  const latest = versions[0];

  redirect(`/tools/${slug}/${latest?.version ?? "v1"}`);
}
