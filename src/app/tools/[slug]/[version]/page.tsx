import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getToolBySlug,
  getToolVersion,
  getToolVersions,
  getAllVersionParams,
} from "@/lib/tools";
import { ToolHeader } from "@/components/tool-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToolParamsTable } from "@/components/tool-params-table";


interface PageProps {
  params: Promise<{ slug: string; version: string }>;
}

export async function generateStaticParams() {
  return getAllVersionParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, version: v } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return { title: "Tool not found" };
  }

  const currentVersion = getToolVersion(slug, v);

  if (!currentVersion) {
    return { title: tool.name };
  }

  return {
    title: `${currentVersion.metadata.title} | AI Coding Tools`,
    description: currentVersion.metadata.description,
  };
}

export default async function ToolVersionPage({ params }: PageProps) {
  const { slug, version: v } = await params;

  const tool = getToolBySlug(slug);
  if (!tool) {
    notFound();
  }

  const currentVersion = getToolVersion(slug, v);
  if (!currentVersion) {
    notFound();
  }

  const versions = getToolVersions(slug);

  return (
    <div className="w-full">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ToolHeader tool={currentVersion} />

        {versions.length > 1 && (
          <div className="mt-6 flex gap-2">
            {versions.map((ver) => (
              <a
                key={ver.version}
                href={`/tools/${slug}/${ver.version}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  ver.version === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {ver.version}
              </a>
            ))}
          </div>
        )}

        {/* Identity */}
        {currentVersion.identity && (
          <section id="identity" className="mt-12 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Identity</h2>
            <div className="h-1 w-12 bg-primary" />
            <Card>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{currentVersion.identity.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tagline</p>
                    <p className="font-medium">{currentVersion.identity.tagline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-medium">{currentVersion.identity.model.name} ({currentVersion.identity.model.id})</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Family</p>
                    <p className="font-medium">{currentVersion.identity.model.family}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Tokens</p>
                    <p className="font-medium">{currentVersion.identity.apiConfig.maxTokens?.toLocaleString() ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Output Format</p>
                    <p className="font-medium">{currentVersion.identity.outputFormat}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {currentVersion.identity.capabilities.map((cap) => (
                      <Badge key={cap} variant="secondary">{cap}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Tools */}
        {currentVersion.tools.length > 0 && (
          <section id="tools" className="mt-12 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Tools ({currentVersion.tools.length})
            </h2>
            <div className="h-1 w-12 bg-primary" />
            <div className="grid gap-4">
              {currentVersion.tools.map((toolItem) => (
                <div
                  key={toolItem.name}
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{toolItem.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 break-words">
                        {toolItem.description}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {toolItem.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {toolItem.parameters.length > 0 && (
                    <ToolParamsTable parameters={toolItem.parameters} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {(currentVersion.skills ?? []).length > 0 && (
          <section id="skills" className="mt-12 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Skills ({currentVersion.skills!.length})
            </h2>
            <div className="h-1 w-12 bg-primary" />
            <div className="grid gap-3">
              {currentVersion.skills!.map((skill) => (
                <div
                  key={skill.name}
                  className="rounded-lg border p-3 hover:bg-muted/50 transition-colors overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm">{skill.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">
                        {skill.description}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {skill.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Memory */}
        {currentVersion.memory && (
          <section id="memory" className="mt-12 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Memory System</h2>
            <div className="h-1 w-12 bg-primary" />
            <Card>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{currentVersion.memory.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Directory</p>
                    <p className="font-mono text-sm">{currentVersion.memory.directory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Main File</p>
                    <p className="font-mono text-sm">{currentVersion.memory.mainFile}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Limit</p>
                    <p className="font-medium">{currentVersion.memory.mainFileLimit}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">What to Save</p>
                  <ul className="space-y-1">
                    {currentVersion.memory.whatToSave.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-green-500">+</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">What NOT to Save</p>
                  <ul className="space-y-1">
                    {currentVersion.memory.whatNotToSave.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-red-500">-</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* System Prompt */}
        {(currentVersion.systemPrompt ?? []).length > 0 && (
          <section id="system-prompt" className="mt-12 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">System Prompt</h2>
            <div className="h-1 w-12 bg-primary" />
            <div className="space-y-6">
              {currentVersion.systemPrompt!.map((section) => (
                <Card key={section.id} id={`sp-${section.id}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {section.rules && section.rules.length > 0 && (
                      <ul className="space-y-1.5">
                        {section.rules.map((rule, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary shrink-0">&#8226;</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.safetyRules && (
                      <div>
                        <p className="text-sm font-medium mb-1.5">Safety Rules</p>
                        <ul className="space-y-1.5">
                          {section.safetyRules.map((rule, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-red-500 shrink-0">!</span>
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.workflow && (
                      <div>
                        <p className="text-sm font-medium mb-1.5">Workflow</p>
                        <ul className="space-y-1.5">
                          {section.workflow.map((step, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-blue-500 shrink-0 font-mono">{idx + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.riskyActions && (
                      <div>
                        <p className="text-sm font-medium mb-1.5">Risky Actions</p>
                        <ul className="space-y-1.5">
                          {section.riskyActions.map((action, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-orange-500 shrink-0">&#9888;</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.priorityMatrix && (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Operation</TableHead>
                              <TableHead className="text-xs">Use</TableHead>
                              <TableHead className="text-xs">Not This</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.priorityMatrix.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-sm">{row.operation}</TableCell>
                                <TableCell className="text-sm font-medium text-green-600 dark:text-green-400">{row.use}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{row.notThis}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {section.events && (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Event</TableHead>
                              <TableHead className="text-xs">When</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.events.map((ev, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-sm">{ev.event}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{ev.when}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {section.tags && (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Tag</TableHead>
                              <TableHead className="text-xs">Purpose</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.tags.map((t, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-sm">{t.tag}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{t.purpose}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Specificities */}
        {currentVersion.specificities && (
          <section id="specificities" className="mt-12 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Specificities</h2>
            <div className="h-1 w-12 bg-primary" />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MCP Servers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentVersion.specificities.mcpServers.map((server) => (
                  <div key={server.name} className="rounded border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{server.name}</h4>
                      <span className="text-xs text-muted-foreground">— {server.description}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{server.instruction}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {server.tools.map((t) => (
                        <Badge key={t} variant="secondary" className="font-mono text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(currentVersion.specificities.environment).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-muted-foreground capitalize">{key}</p>
                      <p className="font-medium text-sm">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Config</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CLAUDE.md Locations</p>
                  <ul className="space-y-0.5">
                    {currentVersion.specificities.userConfig.claudeMdLocations.map((loc, idx) => (
                      <li key={idx} className="text-sm font-mono">{loc}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hooks</p>
                  <ul className="space-y-0.5">
                    {currentVersion.specificities.userConfig.hooksConfigured.map((hook, idx) => (
                      <li key={idx} className="text-sm">{hook}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
