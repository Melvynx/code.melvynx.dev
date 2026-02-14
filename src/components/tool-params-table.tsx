"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";

const MAX_VISIBLE = 3;

type Param = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export function ToolParamsTable({ parameters }: { parameters: Param[] }) {
  const [expanded, setExpanded] = useState(false);
  const needsCollapse = parameters.length > MAX_VISIBLE;
  const visible = needsCollapse && !expanded ? parameters.slice(0, MAX_VISIBLE) : parameters;
  const hiddenCount = parameters.length - MAX_VISIBLE;

  return (
    <div className="mt-3 overflow-hidden">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs w-[20%]">Parameter</TableHead>
            <TableHead className="text-xs w-[12%]">Type</TableHead>
            <TableHead className="text-xs w-[10%]">Required</TableHead>
            <TableHead className="text-xs w-[58%]">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((param) => (
            <TableRow key={param.name}>
              <TableCell className="font-mono text-xs break-all">{param.name}</TableCell>
              <TableCell className="text-xs text-muted-foreground break-words">
                {param.type}
              </TableCell>
              <TableCell className="text-xs">
                {param.required ? (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0"
                  >
                    yes
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">no</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground break-words">
                {param.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {needsCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="size-3" />
              Show {hiddenCount} more parameters
            </>
          )}
        </button>
      )}
    </div>
  );
}
