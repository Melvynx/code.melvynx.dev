import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

export interface PromptVersion {
  version: string;
  content: string;
}

export interface PromptEntry {
  slug: string;
  name: string;
  description: string;
  versions: { version: string }[];
}

const CONTENT_DIR = join(process.cwd(), "content/prompts");

const PROMPT_META: Record<string, { name: string; description: string }> = {
  "bouncing-ball-polygon": {
    name: "Bouncing Ball Polygon",
    description:
      "Physics simulation of a red ball bouncing inside a slowly rotating heptagon.",
  },
  "youtube-thumbnail-generator": {
    name: "YouTube Thumbnail Generator",
    description:
      "Build a Next.js app that generates YouTube thumbnails using Gemini's image generation API.",
  },
  "spongebob-3d-world-threejs": {
    name: "SpongeBob 3D World (Three.js)",
    description:
      "Interactive 3D SpongeBob SquarePants underwater world in a single self-contained HTML file using Three.js.",
  },
};

export function getAllPrompts(): PromptEntry[] {
  if (!existsSync(CONTENT_DIR)) return [];
  return readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const slug = d.name;
      const dir = join(CONTENT_DIR, slug);
      const versions = readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => ({ version: f.replace(".md", "") }))
        .sort((a, b) => a.version.localeCompare(b.version));
      const meta = PROMPT_META[slug] ?? { name: slug, description: "" };
      return { slug, ...meta, versions };
    });
}

export function getPromptBySlug(slug: string): PromptEntry | null {
  return getAllPrompts().find((p) => p.slug === slug) ?? null;
}

export function getPromptVersion(
  slug: string,
  version: string
): PromptVersion | null {
  const filePath = join(CONTENT_DIR, slug, `${version}.md`);
  if (!existsSync(filePath)) return null;
  return { version, content: readFileSync(filePath, "utf-8") };
}
