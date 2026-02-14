"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ToolIndexEntry } from "@/lib/types";

interface CompareSelectorProps {
  tools: ToolIndexEntry[];
}

export function CompareSelector({ tools }: CompareSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const leftParam = searchParams.get("left") || "";
  const rightParam = searchParams.get("right") || "";

  const toolOptions = tools.flatMap((tool) =>
    tool.versions.map((version) => ({
      value: `${tool.slug}:${version.version}`,
      label: `${tool.name} (${version.version})`,
      slug: tool.slug,
    }))
  );

  const handleLeftChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("left", value);
    router.push(`/compare?${params.toString()}`);
  };

  const handleRightChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("right", value);
    router.push(`/compare?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">
          Left Tool
        </label>
        <Select value={leftParam} onValueChange={handleLeftChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select left tool" />
          </SelectTrigger>
          <SelectContent>
            {toolOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">
          Right Tool
        </label>
        <Select value={rightParam} onValueChange={handleRightChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select right tool" />
          </SelectTrigger>
          <SelectContent>
            {toolOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
