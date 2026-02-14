"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  GitCompare,
  Home,
  MousePointerClick,
  Terminal,
  Sparkles,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const TOOL_ICONS: Record<string, React.ElementType> = {
  "claude-code": Terminal,
  codex: Bot,
  cursor: MousePointerClick,
};

const TOOLS = [
  {
    slug: "claude-code",
    name: "Claude Code",
    org: "Anthropic",
  },
  {
    slug: "codex",
    name: "Codex",
    org: "OpenAI",
  },
  {
    slug: "cursor",
    name: "Cursor",
    org: "Anysphere",
  },
];

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-2">
        <h4 className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wider uppercase">
          Navigation
        </h4>
        <ul className="flex flex-col">
          <li>
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1 text-[13px] transition-colors",
                pathname === "/"
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Home className="size-3.5" />
              Overview
            </Link>
          </li>
          <li>
            <Link
              href="/compare"
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1 text-[13px] transition-colors",
                pathname === "/compare"
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GitCompare className="size-3.5" />
              Compare
            </Link>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wider uppercase">
          Tools
        </h4>
        <ul className="flex flex-col">
          {TOOLS.map((tool) => {
            const Icon = TOOL_ICONS[tool.slug] || Bot;
            const isToolActive = pathname.startsWith(`/tools/${tool.slug}`);

            return (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className={cn(
                    "flex items-center gap-2 rounded px-2 py-1 text-[13px] transition-colors",
                    isToolActive
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {tool.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r lg:block">
      <SidebarNav />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 lg:hidden" aria-label="Open navigation menu">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            AI Coding Tools
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto" onClick={() => setOpen(false)}>
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  );
}
