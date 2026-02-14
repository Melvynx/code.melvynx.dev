import Link from "next/link";
import { Bot, Terminal, Cpu, Wrench, Orbit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ToolIndexEntry } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "claude-code": Terminal,
  cursor: Cpu,
  codex: Bot,
  droid: Wrench,
  antigravity: Orbit,
};

export function ToolCard({ tool }: { tool: ToolIndexEntry }) {
  const latestVersion = tool.versions[0];
  const Icon =
    iconMap[tool.slug.toLowerCase()] ||
    iconMap[tool.organization.toLowerCase()] ||
    Bot;

  return (
    <Link href={`/tools/${tool.slug}`}>
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <CardTitle className="line-clamp-1">{tool.name}</CardTitle>
              <Badge variant="outline" className="w-fit">
                {tool.organization}
              </Badge>
            </div>
            <Icon className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="line-clamp-2">
            {latestVersion.description}
          </CardDescription>

          <div className="flex gap-4 text-sm">
            <div>
              <div className="font-semibold text-foreground">
                {latestVersion.toolCount}
              </div>
              <div className="text-muted-foreground">Tools</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {tool.versions.length}
              </div>
              <div className="text-muted-foreground">Versions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
