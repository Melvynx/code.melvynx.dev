"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Clock,
  Target,
  Repeat2,
  Pencil,
  Trash2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AIModel = {
  id: string;
  name: string;
  provider?: string;
};

type TestPrompt = {
  id: string;
  name: string;
  category?: string;
  slug?: string;
  isCustom?: boolean;
};

type TestResult = {
  time?: number;
  score?: number;
  shots?: number;
};

type ModelTestData = {
  models: AIModel[];
  customPrompts: TestPrompt[];
  results: Record<string, TestResult>;
};

type Props = {
  systemPrompts: TestPrompt[];
};

const STORAGE_KEY = "model-test-data";

const defaultData: ModelTestData = {
  models: [],
  customPrompts: [],
  results: {},
};

function resultKey(modelId: string, promptId: string) {
  return `${modelId}::${promptId}`;
}

function parseStoredData(raw: string): ModelTestData | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.models) &&
      Array.isArray(parsed.customPrompts) &&
      typeof parsed.results === "object"
    ) {
      return parsed as ModelTestData;
    }
  } catch {}
  return null;
}

export function ModelTestBoard({ systemPrompts }: Props) {
  const [data, setData] = useState<ModelTestData>(defaultData);
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [addPromptOpen, setAddPromptOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    modelId: string;
    promptId: string;
  } | null>(null);

  const [modelName, setModelName] = useState("");
  const [modelProvider, setModelProvider] = useState("");

  const [promptName, setPromptName] = useState("");
  const [promptCategory, setPromptCategory] = useState("");

  const [cellTime, setCellTime] = useState("");
  const [cellScore, setCellScore] = useState("");
  const [cellShots, setCellShots] = useState("");

  // F1 + F8: load from localStorage and keep in sync across tabs
  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = parseStoredData(stored);
          if (parsed) setData(parsed);
        }
      } catch {}
    };

    load();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const parsed = parseStoredData(e.newValue);
        if (parsed) setData(parsed);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // F2: use functional setState to avoid stale closure issues
  function saveData(updater: (prev: ModelTestData) => ModelTestData) {
    setData((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function handleAddModel(e: React.FormEvent) {
    e.preventDefault();
    if (!modelName.trim()) return;
    const model: AIModel = {
      id: crypto.randomUUID(),
      name: modelName.trim(),
      provider: modelProvider.trim() || undefined,
    };
    saveData((prev) => ({ ...prev, models: [...prev.models, model] }));
    setModelName("");
    setModelProvider("");
    setAddModelOpen(false);
  }

  function handleRemoveModel(modelId: string) {
    saveData((prev) => {
      const results = { ...prev.results };
      Object.keys(results).forEach((key) => {
        if (key.startsWith(modelId + "::")) delete results[key];
      });
      return { ...prev, models: prev.models.filter((m) => m.id !== modelId), results };
    });
  }

  function handleAddPrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!promptName.trim()) return;
    const prompt: TestPrompt = {
      id: crypto.randomUUID(),
      name: promptName.trim(),
      category: promptCategory.trim() || undefined,
      isCustom: true,
    };
    saveData((prev) => ({ ...prev, customPrompts: [...prev.customPrompts, prompt] }));
    setPromptName("");
    setPromptCategory("");
    setAddPromptOpen(false);
  }

  function handleRemovePrompt(promptId: string) {
    if (!promptId) return;
    saveData((prev) => {
      const results = { ...prev.results };
      Object.keys(results).forEach((key) => {
        if (key.endsWith("::" + promptId)) delete results[key];
      });
      return { ...prev, customPrompts: prev.customPrompts.filter((p) => p.id !== promptId), results };
    });
  }

  function openEditCell(modelId: string, promptId: string) {
    const key = resultKey(modelId, promptId);
    const result = data.results[key];
    setCellTime(result?.time?.toString() ?? "");
    setCellScore(result?.score?.toString() ?? "");
    setCellShots(result?.shots?.toString() ?? "");
    setEditingCell({ modelId, promptId });
  }

  function handleSaveCell(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCell) return;
    const key = resultKey(editingCell.modelId, editingCell.promptId);
    const result: TestResult = {};
    // F3: validate numeric inputs in JS (HTML min/max are hints only)
    const t = parseFloat(cellTime);
    if (Number.isFinite(t) && t >= 0) result.time = t;
    const s = parseFloat(cellScore);
    if (Number.isFinite(s) && s >= 0 && s <= 100) result.score = s;
    const sh = parseInt(cellShots, 10);
    if (Number.isFinite(sh) && sh >= 1) result.shots = sh;
    saveData((prev) => ({ ...prev, results: { ...prev.results, [key]: result } }));
    setEditingCell(null);
  }

  const allPrompts = [...systemPrompts, ...data.customPrompts];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Tests</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Benchmark AI models against prompts. Track generation time, success
            score, and number of attempts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddPromptOpen(true)}
          >
            <Plus className="size-3.5" />
            Add Prompt
          </Button>
          <Button size="sm" onClick={() => setAddModelOpen(true)}>
            <Plus className="size-3.5" />
            Add Model
          </Button>
        </div>
      </div>

      {data.models.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <BarChart3 className="text-muted-foreground mx-auto mb-4 size-8" />
          <h2 className="font-semibold">No models yet</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Add your first model to start benchmarking against prompts.
          </p>
          <Button className="mt-4" onClick={() => setAddModelOpen(true)}>
            <Plus className="size-4" />
            Add Model
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* F6: consistent bg-background + border-r for sticky column */}
                <TableHead className="sticky left-0 z-10 min-w-[200px] border-r bg-background font-semibold">
                  Prompt / Model
                </TableHead>
                {data.models.map((model) => (
                  <TableHead key={model.id} className="min-w-[180px]">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">{model.name}</div>
                        {model.provider && (
                          <div className="text-muted-foreground text-xs font-normal">
                            {model.provider}
                          </div>
                        )}
                      </div>
                      {/* F4: aria-label on icon-only button */}
                      <button
                        aria-label={`Remove model ${model.name}`}
                        onClick={() => handleRemoveModel(model.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPrompts.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell className="sticky left-0 z-10 border-r bg-background">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{prompt.name}</div>
                        {prompt.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {prompt.category}
                          </Badge>
                        )}
                      </div>
                      {prompt.isCustom && (
                        /* F4: aria-label on icon-only button */
                        <button
                          aria-label={`Remove prompt ${prompt.name}`}
                          onClick={() => handleRemovePrompt(prompt.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                  {data.models.map((model) => {
                    const key = resultKey(model.id, prompt.id);
                    const result = data.results[key];
                    return (
                      <TableCell
                        key={model.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => openEditCell(model.id, prompt.id)}
                      >
                        {result &&
                        (result.time !== undefined ||
                          result.score !== undefined ||
                          result.shots !== undefined) ? (
                          <div className="space-y-1 text-xs">
                            {result.time !== undefined && (
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Clock className="size-3" />
                                {result.time}s
                              </div>
                            )}
                            {result.score !== undefined && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <Target className="size-3" />
                                {result.score}%
                              </div>
                            )}
                            {result.shots !== undefined && (
                              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Repeat2 className="size-3" />
                                {result.shots} shot
                                {result.shots !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground/50 flex items-center gap-1 text-xs">
                            <Pencil className="size-3" />
                            Add result
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* F7: reset form state on dismiss */}
      <Dialog
        open={addModelOpen}
        onOpenChange={(open) => {
          if (!open) { setModelName(""); setModelProvider(""); }
          setAddModelOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Model</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddModel} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              {/* F5: associated label/input pairs */}
              <label htmlFor="model-name" className="text-sm font-medium">
                Model name *
              </label>
              <Input
                id="model-name"
                placeholder="e.g. claude-opus-4-5"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="model-provider" className="text-sm font-medium">
                Provider
              </label>
              <Input
                id="model-provider"
                placeholder="e.g. Anthropic"
                value={modelProvider}
                onChange={(e) => setModelProvider(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!modelName.trim()}>
                Add Model
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* F7: reset form state on dismiss */}
      <Dialog
        open={addPromptOpen}
        onOpenChange={(open) => {
          if (!open) { setPromptName(""); setPromptCategory(""); }
          setAddPromptOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Prompt</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPrompt} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              {/* F5: associated label/input pairs */}
              <label htmlFor="prompt-name" className="text-sm font-medium">
                Prompt name *
              </label>
              <Input
                id="prompt-name"
                placeholder="e.g. Code completion test"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prompt-category" className="text-sm font-medium">
                Category
              </label>
              <Input
                id="prompt-category"
                placeholder="e.g. Frontend, Backend, Creative"
                value={promptCategory}
                onChange={(e) => setPromptCategory(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!promptName.trim()}>
                Add Prompt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingCell}
        onOpenChange={(open) => !open && setEditingCell(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Result</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCell} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              {/* F5: associated label/input pairs */}
              <label
                htmlFor="cell-time"
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                <Clock className="size-3.5" />
                Time (seconds)
              </label>
              <Input
                id="cell-time"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 12.5"
                value={cellTime}
                onChange={(e) => setCellTime(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cell-score"
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                <Target className="size-3.5" />
                Score (%)
              </label>
              <Input
                id="cell-score"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 85"
                value={cellScore}
                onChange={(e) => setCellScore(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cell-shots"
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                <Repeat2 className="size-3.5" />
                Shots (attempts)
              </label>
              <Input
                id="cell-shots"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 3"
                value={cellShots}
                onChange={(e) => setCellShots(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Result</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
