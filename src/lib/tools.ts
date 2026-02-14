import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import type { ToolIndexEntry, ToolVersion } from "./types";

const CONTENT_DIR = join(process.cwd(), "content/tools");

export function getAllTools(): ToolIndexEntry[] {
  const indexPath = join(CONTENT_DIR, "index.json");
  const data = JSON.parse(readFileSync(indexPath, "utf-8"));
  return data as ToolIndexEntry[];
}

export function getToolBySlug(slug: string): ToolIndexEntry | null {
  const tools = getAllTools();
  return tools.find((t) => t.slug === slug) || null;
}

export function getToolVersion(
  slug: string,
  version: string
): ToolVersion | null {
  const versionPath = join(CONTENT_DIR, slug, `${version}.json`);
  if (!existsSync(versionPath)) return null;
  return JSON.parse(readFileSync(versionPath, "utf-8")) as ToolVersion;
}

export function getToolVersions(slug: string): ToolVersion[] {
  const toolDir = join(CONTENT_DIR, slug);
  if (!existsSync(toolDir)) return [];

  return readdirSync(toolDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = JSON.parse(readFileSync(join(toolDir, f), "utf-8"));
      return data as ToolVersion;
    })
    .sort((a, b) => a.order - b.order);
}

export function getAllToolSlugs(): string[] {
  return getAllTools().map((t) => t.slug);
}

export function getAllVersionParams(): { slug: string; version: string }[] {
  const tools = getAllTools();
  const params: { slug: string; version: string }[] = [];
  for (const tool of tools) {
    for (const v of tool.versions) {
      params.push({ slug: tool.slug, version: v.version });
    }
  }
  return params;
}
