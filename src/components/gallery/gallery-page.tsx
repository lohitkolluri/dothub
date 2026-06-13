"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, ArrowUp, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const toolCategories = [
  "All", "Editor", "Terminal", "Shell",
  "Window Manager", "Bar", "Launcher", "Theme",
];

const sorts = [
  { key: "hot", label: "Hot" },
  { key: "top", label: "Top" },
  { key: "new", label: "New" },
] as const;

export function GalleryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState<"hot" | "top" | "new">("hot");

  return (
    <div className="min-h-screen">
      {/* ─── Search + filters ───────────────────────────── */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
            <input
              type="text"
              placeholder="Search by tool, title, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-fg focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </div>

          {/* Category filters */}
          <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {toolCategories.map((cat) => (
              <Badge
                key={cat}
                variant={activeCategory === cat ? "default" : "secondary"}
                className="cursor-pointer shrink-0"
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Sort tabs — Reddit-style */}
          <div className="flex items-center gap-1 text-sm">
            {sorts.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSort(s.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  activeSort === s.key
                    ? "bg-accent-muted text-accent"
                    : "text-muted-fg hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Gallery grid ──────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Empty state — no configs yet */}
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted text-accent">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Gallery">
                <title>Gallery</title>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">No configurations yet</h2>
            <p className="mt-2 max-w-md text-muted-fg">
              Share your dotfiles with the community and help others
              discover great setups. Be the first!
            </p>
            <div className="mt-8 flex gap-3">
              <Button size="lg" asChild>
                <Link href="/submit">Submit your dotfiles</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                  Open GitHub
                </Link>
              </Button>
            </div>

            {/* Preview cards */}
            <div className="mt-16 grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border-2 border-dashed border-border/50 bg-surface/30 p-6 text-center opacity-60"
                >
                  <div className="mb-3 aspect-[16/10] rounded-lg bg-surface-hover/50" />
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded-full bg-surface-hover/50 mx-auto" />
                    <div className="h-2 w-1/2 rounded-full bg-surface-hover/50 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
