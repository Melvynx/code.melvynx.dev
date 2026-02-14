import type { ToolVersion } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ToolHeaderProps {
  tool: ToolVersion;
}

export function ToolHeader({ tool }: ToolHeaderProps) {
  const { metadata, identity } = tool;

  const statEntries = Object.entries(metadata.stats);

  return (
    <div className="space-y-6 pb-8 border-b">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight">
            {metadata.title}
          </h1>
          <Badge variant="secondary">{metadata.organization}</Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {metadata.description}
        </p>
      </div>

      {statEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {statEntries.map(([key, value]) => (
            <div key={key} className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground capitalize">
                {key.replace(/Count$/, "s").replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="text-2xl font-semibold mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {identity && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline">
            <span className="text-xs font-semibold mr-1">Model:</span>
            <span>{identity.model.name}</span>
          </Badge>
          <Badge variant="outline">
            <span className="text-xs font-semibold mr-1">Cutoff:</span>
            <span>{identity.model.knowledgeCutoff}</span>
          </Badge>
          <Badge variant="outline">
            <span className="text-xs font-semibold mr-1">Role:</span>
            <span>{identity.role}</span>
          </Badge>
        </div>
      )}
    </div>
  );
}
