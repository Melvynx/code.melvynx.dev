import { getAllTools, getToolVersion } from "@/lib/tools";
import { CompareSelector } from "@/components/compare-selector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ToolVersion } from "@/lib/types";
import { Suspense } from "react";
import { Check, Minus, X } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ left?: string; right?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tools = getAllTools();

  let leftTool: ToolVersion | null = null;
  let rightTool: ToolVersion | null = null;

  if (params.left) {
    const [leftSlug, leftVersion] = params.left.split(":");
    leftTool = getToolVersion(leftSlug, leftVersion);
  }

  if (params.right) {
    const [rightSlug, rightVersion] = params.right.split(":");
    rightTool = getToolVersion(rightSlug, rightVersion);
  }

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="space-y-2 mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Compare AI Coding Tools
          </h1>
          <p className="text-lg text-muted-foreground">
            Side-by-side comparison of features, tools, and capabilities
          </p>
        </div>

        <Suspense>
          <CompareSelector tools={tools} />
        </Suspense>

        {leftTool && rightTool ? (
          <CompareContent left={leftTool} right={rightTool} />
        ) : (
          <Card>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Select two tools above to compare their features and documentation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function CompareContent({ left, right }: { left: ToolVersion; right: ToolVersion }) {
  const leftTools = new Set(left.tools.map((t) => t.name));
  const rightTools = new Set(right.tools.map((t) => t.name));
  const allToolNames = [...new Set([...leftTools, ...rightTools])].sort();
  const sharedTools = allToolNames.filter((n) => leftTools.has(n) && rightTools.has(n));
  const leftOnlyTools = allToolNames.filter((n) => leftTools.has(n) && !rightTools.has(n));
  const rightOnlyTools = allToolNames.filter((n) => !leftTools.has(n) && rightTools.has(n));

  const leftSkills = new Set((left.skills ?? []).map((s) => s.name));
  const rightSkills = new Set((right.skills ?? []).map((s) => s.name));
  const allSkillNames = [...new Set([...leftSkills, ...rightSkills])].sort();
  const sharedSkills = allSkillNames.filter((n) => leftSkills.has(n) && rightSkills.has(n));
  const leftOnlySkills = allSkillNames.filter((n) => leftSkills.has(n) && !rightSkills.has(n));
  const rightOnlySkills = allSkillNames.filter((n) => !leftSkills.has(n) && rightSkills.has(n));

  const leftCapabilities = new Set(left.identity?.capabilities ?? []);
  const rightCapabilities = new Set(right.identity?.capabilities ?? []);
  const allCapabilities = [...new Set([...leftCapabilities, ...rightCapabilities])].sort();

  const leftSystemSections = new Set((left.systemPrompt ?? []).map((s) => s.title));
  const rightSystemSections = new Set((right.systemPrompt ?? []).map((s) => s.title));
  const allSystemSections = [...new Set([...leftSystemSections, ...rightSystemSections])].sort();

  const leftMcp = new Set((left.specificities?.mcpServers ?? []).map((s) => s.name));
  const rightMcp = new Set((right.specificities?.mcpServers ?? []).map((s) => s.name));
  const allMcp = [...new Set([...leftMcp, ...rightMcp])].sort();

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SummaryCard tool={left} />
        <SummaryCard tool={right} />
      </div>

      {/* Stats Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stats Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <StatsCompareTable left={left} right={right} />
        </CardContent>
      </Card>

      {/* Identity Comparison */}
      {(left.identity || right.identity) && (
        <Card>
          <CardHeader>
            <CardTitle>Identity & Model</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Property</TableHead>
                  <TableHead>{left.metadata.name}</TableHead>
                  <TableHead>{right.metadata.name}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <CompareRow
                  label="Model"
                  left={left.identity?.model.name}
                  right={right.identity?.model.name}
                />
                <CompareRow
                  label="Model ID"
                  left={left.identity?.model.id}
                  right={right.identity?.model.id}
                  mono
                />
                <CompareRow
                  label="Family"
                  left={left.identity?.model.family}
                  right={right.identity?.model.family}
                />
                <CompareRow
                  label="Knowledge Cutoff"
                  left={left.identity?.model.knowledgeCutoff}
                  right={right.identity?.model.knowledgeCutoff}
                />
                <CompareRow
                  label="Max Tokens"
                  left={left.identity?.apiConfig.maxTokens?.toLocaleString()}
                  right={right.identity?.apiConfig.maxTokens?.toLocaleString()}
                />
                <CompareRow
                  label="Streaming"
                  left={left.identity?.apiConfig.stream ? "Yes" : "No"}
                  right={right.identity?.apiConfig.stream ? "Yes" : "No"}
                />
                <CompareRow
                  label="Thinking"
                  left={left.identity?.apiConfig.thinking?.type}
                  right={right.identity?.apiConfig.thinking?.type}
                />
                <CompareRow
                  label="Output Format"
                  left={left.identity?.outputFormat}
                  right={right.identity?.outputFormat}
                />
                <CompareRow
                  label="Role"
                  left={left.identity?.role}
                  right={right.identity?.role}
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Capabilities Matrix */}
      {allCapabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>
              {leftCapabilities.size} vs {rightCapabilities.size} capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capability</TableHead>
                  <TableHead className="w-[100px] text-center">{left.metadata.name}</TableHead>
                  <TableHead className="w-[100px] text-center">{right.metadata.name}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCapabilities.map((cap) => (
                  <TableRow key={cap}>
                    <TableCell className="text-sm">{cap}</TableCell>
                    <TableCell className="text-center">
                      <PresenceIcon present={leftCapabilities.has(cap)} />
                    </TableCell>
                    <TableCell className="text-center">
                      <PresenceIcon present={rightCapabilities.has(cap)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tools Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <CardDescription>
            {left.tools.length} vs {right.tools.length} tools
            {" / "}
            <span className="text-green-500">{sharedTools.length} shared</span>
            {leftOnlyTools.length > 0 && (
              <span className="text-blue-500">, {leftOnlyTools.length} unique to {left.metadata.name}</span>
            )}
            {rightOnlyTools.length > 0 && (
              <span className="text-orange-500">, {rightOnlyTools.length} unique to {right.metadata.name}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead className="w-[100px] text-center">{left.metadata.name}</TableHead>
                <TableHead className="w-[100px] text-center">{right.metadata.name}</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allToolNames.map((name) => {
                const lTool = left.tools.find((t) => t.name === name);
                const rTool = right.tools.find((t) => t.name === name);
                const tags = lTool?.tags ?? rTool?.tags ?? [];
                return (
                  <TableRow key={name}>
                    <TableCell className="font-medium text-sm">{name}</TableCell>
                    <TableCell className="text-center">
                      <PresenceIcon present={leftTools.has(name)} />
                    </TableCell>
                    <TableCell className="text-center">
                      <PresenceIcon present={rightTools.has(name)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Skills Comparison */}
      {allSkillNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              {leftSkills.size} vs {rightSkills.size} skills
              {" / "}
              <span className="text-green-500">{sharedSkills.length} shared</span>
              {leftOnlySkills.length > 0 && (
                <span className="text-blue-500">, {leftOnlySkills.length} unique to {left.metadata.name}</span>
              )}
              {rightOnlySkills.length > 0 && (
                <span className="text-orange-500">, {rightOnlySkills.length} unique to {right.metadata.name}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead className="w-[100px] text-center">{left.metadata.name}</TableHead>
                  <TableHead className="w-[100px] text-center">{right.metadata.name}</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSkillNames.map((name) => {
                  const lSkill = (left.skills ?? []).find((s) => s.name === name);
                  const rSkill = (right.skills ?? []).find((s) => s.name === name);
                  const tags = lSkill?.tags ?? rSkill?.tags ?? [];
                  return (
                    <TableRow key={name}>
                      <TableCell className="font-medium text-sm">{name}</TableCell>
                      <TableCell className="text-center">
                        <PresenceIcon present={leftSkills.has(name)} />
                      </TableCell>
                      <TableCell className="text-center">
                        <PresenceIcon present={rightSkills.has(name)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Memory Comparison */}
      {(left.memory || right.memory) && (
        <Card>
          <CardHeader>
            <CardTitle>Memory System</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Property</TableHead>
                  <TableHead>{left.metadata.name}</TableHead>
                  <TableHead>{right.metadata.name}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <CompareRow label="Type" left={left.memory?.type} right={right.memory?.type} />
                <CompareRow label="Directory" left={left.memory?.directory} right={right.memory?.directory} mono />
                <CompareRow label="Main File" left={left.memory?.mainFile} right={right.memory?.mainFile} mono />
                <CompareRow label="Limit" left={left.memory?.mainFileLimit} right={right.memory?.mainFileLimit} />
                <CompareRow label="Persistence" left={left.memory?.persistence} right={right.memory?.persistence} />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* System Prompt Sections */}
      {allSystemSections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>System Prompt Sections</CardTitle>
            <CardDescription>
              {leftSystemSections.size} vs {rightSystemSections.size} sections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead className="w-[100px] text-center">{left.metadata.name}</TableHead>
                  <TableHead className="w-[100px] text-center">{right.metadata.name}</TableHead>
                  <TableHead className="text-right">Rules (L / R)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSystemSections.map((title) => {
                  const lSection = (left.systemPrompt ?? []).find((s) => s.title === title);
                  const rSection = (right.systemPrompt ?? []).find((s) => s.title === title);
                  const lRuleCount = (lSection?.rules?.length ?? 0) + (lSection?.safetyRules?.length ?? 0);
                  const rRuleCount = (rSection?.rules?.length ?? 0) + (rSection?.safetyRules?.length ?? 0);
                  return (
                    <TableRow key={title}>
                      <TableCell className="font-medium text-sm">{title}</TableCell>
                      <TableCell className="text-center">
                        <PresenceIcon present={leftSystemSections.has(title)} />
                      </TableCell>
                      <TableCell className="text-center">
                        <PresenceIcon present={rightSystemSections.has(title)} />
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {lRuleCount || "—"} / {rRuleCount || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* MCP Servers */}
      {allMcp.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>MCP Servers</CardTitle>
            <CardDescription>
              {leftMcp.size} vs {rightMcp.size} servers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Server</TableHead>
                  <TableHead className="w-[100px] text-center">{left.metadata.name}</TableHead>
                  <TableHead className="w-[100px] text-center">{right.metadata.name}</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMcp.map((name) => {
                  const lServer = (left.specificities?.mcpServers ?? []).find((s) => s.name === name);
                  const rServer = (right.specificities?.mcpServers ?? []).find((s) => s.name === name);
                  return (
                    <TableRow key={name}>
                      <TableCell className="font-medium text-sm">{name}</TableCell>
                      <TableCell className="text-center">
                        <PresenceIcon present={leftMcp.has(name)} />
                      </TableCell>
                      <TableCell className="text-center">
                        <PresenceIcon present={rightMcp.has(name)} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lServer?.description ?? rServer?.description ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Environment */}
      {(left.specificities?.environment || right.specificities?.environment) && (
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const leftEnv = left.specificities?.environment ?? {};
              const rightEnv = right.specificities?.environment ?? {};
              const allKeys = [...new Set([...Object.keys(leftEnv), ...Object.keys(rightEnv)])].sort();
              return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Property</TableHead>
                      <TableHead>{left.metadata.name}</TableHead>
                      <TableHead>{right.metadata.name}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allKeys.map((key) => (
                      <CompareRow
                        key={key}
                        label={key}
                        left={leftEnv[key] != null ? String(leftEnv[key]) : undefined}
                        right={rightEnv[key] != null ? String(rightEnv[key]) : undefined}
                      />
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ tool }: { tool: ToolVersion }) {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>{tool.metadata.name}</CardTitle>
          <Badge variant="outline" className="w-fit">
            {tool.metadata.organization}
          </Badge>
          <CardDescription>v{tool.version}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {tool.metadata.description}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <StatBlock label="Tools" value={tool.tools.length} />
          <StatBlock label="Skills" value={(tool.skills ?? []).length} />
          <StatBlock label="System Prompt Sections" value={(tool.systemPrompt ?? []).length} />
          <StatBlock label="MCP Servers" value={(tool.specificities?.mcpServers ?? []).length} />
          <StatBlock label="Capabilities" value={(tool.identity?.capabilities ?? []).length} />
          <StatBlock label="Memory" value={tool.memory ? "Yes" : "No"} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StatsCompareTable({ left, right }: { left: ToolVersion; right: ToolVersion }) {
  const rows = [
    { label: "Tools", left: left.tools.length, right: right.tools.length },
    { label: "Skills", left: (left.skills ?? []).length, right: (right.skills ?? []).length },
    { label: "System Prompt Sections", left: (left.systemPrompt ?? []).length, right: (right.systemPrompt ?? []).length },
    { label: "Capabilities", left: (left.identity?.capabilities ?? []).length, right: (right.identity?.capabilities ?? []).length },
    { label: "MCP Servers", left: (left.specificities?.mcpServers ?? []).length, right: (right.specificities?.mcpServers ?? []).length },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metric</TableHead>
          <TableHead className="text-center">{left.metadata.name}</TableHead>
          <TableHead className="text-center">{right.metadata.name}</TableHead>
          <TableHead className="text-center">Diff</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const diff = row.left - row.right;
          return (
            <TableRow key={row.label}>
              <TableCell className="font-medium text-sm">{row.label}</TableCell>
              <TableCell className="text-center font-semibold">{row.left}</TableCell>
              <TableCell className="text-center font-semibold">{row.right}</TableCell>
              <TableCell className="text-center">
                {diff === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <span className={diff > 0 ? "text-green-500" : "text-red-500"}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function CompareRow({
  label,
  left,
  right,
  mono,
}: {
  label: string;
  left?: string;
  right?: string;
  mono?: boolean;
}) {
  const same = left && right && left === right;
  const textClass = mono ? "font-mono text-xs" : "text-sm";
  return (
    <TableRow>
      <TableCell className="font-medium text-sm">{label}</TableCell>
      <TableCell className={`${textClass} ${same ? "text-muted-foreground" : ""}`}>
        {left ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className={`${textClass} ${same ? "text-muted-foreground" : ""}`}>
        {right ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
    </TableRow>
  );
}

function PresenceIcon({ present }: { present: boolean }) {
  return present ? (
    <Check className="inline-block size-4 text-green-500" />
  ) : (
    <X className="inline-block size-4 text-muted-foreground/40" />
  );
}
