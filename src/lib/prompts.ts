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

const versionCollator = new Intl.Collator("en", { numeric: true });

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
  "mini-figma-clone": {
    name: "Mini Figma Clone",
    description:
      "Build the most complete, polished, architecturally sound mini-Figma clone possible in one shot - infinite canvas, scene graph, command-pattern undo, and production-grade code quality.",
  },
  "car-brick-wall-crash": {
    name: "Car Brick Wall Crash",
    description:
      "Single-file canvas physics experiment where a car crashes into a configurable brick wall with realistic momentum, mass, friction, and collapse behavior.",
  },
  "ecosystem-evolution-simulator": {
    name: "Ecosystem Evolution Simulator",
    description:
      "Single-file artificial-life simulator with predator/prey/food energy dynamics, a round rotating 3D map, cute animated agents, live controls, and real population graphs.",
  },
  "thumbfast-drawing-inspiration-editor": {
    name: "Thumbfast Drawing Inspiration Editor",
    description:
      "Implement a full drawing-template editor in Thumbfast so users can create, save, edit, and reuse drawn thumbnail inspirations.",
  },
  "elysian-taste-challenge": {
    name: "Elysian Taste Challenge",
    description:
      "An intentionally open-ended landing-page benchmark that tests visual taste, originality, art direction, and creative use of a bold botanical image.",
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
        .sort((a, b) => versionCollator.compare(a.version, b.version));
      const meta = PROMPT_META[slug] ?? { name: slug, description: "" };
      return { slug, ...meta, versions };
    });
}

export function getPromptBySlug(slug: string): PromptEntry | null {
  return getAllPrompts().find((p) => p.slug === slug) ?? null;
}

export function getLatestPromptVersion(prompt: PromptEntry): string | null {
  return prompt.versions.at(-1)?.version ?? null;
}

export function getPromptVersion(
  slug: string,
  version: string
): PromptVersion | null {
  const filePath = join(CONTENT_DIR, slug, `${version}.md`);
  if (!existsSync(filePath)) return null;
  return { version, content: readFileSync(filePath, "utf-8") };
}
