import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar, MobileSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderSearch } from "@/components/header-search";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Coding Tools - System Prompts & Documentation",
  description:
    "Compare system prompts, tools, and capabilities of AI coding assistants: Claude Code, Cursor, Codex, Droid, and Antigravity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <MobileSidebar />
              <Link
                href="/"
                className="flex items-center gap-2"
              >
                <Sparkles className="size-5 text-primary" />
                <span className="text-sm font-semibold tracking-tight">
                  AI Coding Tools
                </span>
              </Link>
              <div className="flex-1" />
              <HeaderSearch />
              <ThemeToggle />
            </header>
            <div className="flex flex-1">
              <AppSidebar />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
