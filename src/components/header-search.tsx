import { getAllTools } from "@/lib/tools";
import { SearchCommand } from "./search-command";

export function HeaderSearch() {
  const tools = getAllTools().map((t) => ({
    slug: t.slug,
    name: t.name,
    organization: t.organization,
    versions: t.versions.map((v) => ({ version: v.version, name: v.name })),
  }));

  return <SearchCommand tools={tools} />;
}
