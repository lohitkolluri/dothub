"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Grid3X3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfigCard, type ConfigCardData } from "./config-card";

const toolCategories = [
  "All", "Editor", "Terminal", "Shell", "Window Manager",
  "Bar", "Launcher", "Theme", "Font", "Notifications", "Browser",
];

const sorts = [
  { key: "hot", label: "Hot" },
  { key: "top", label: "Top" },
  { key: "new", label: "New" },
] as const;

/* ─── Skeleton card ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-surface-hover" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-surface-hover" />
        <div className="h-3 w-full rounded bg-surface-hover" />
        <div className="h-3 w-1/2 rounded bg-surface-hover" />
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <div className="h-5 w-12 rounded bg-surface-hover" />
        <div className="h-5 w-20 rounded bg-surface-hover" />
      </div>
    </div>
  );
}

export function GalleryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState<"hot" | "top" | "new">("hot");
  const [configs, setConfigs] = useState<ConfigCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/configs")
      .then((r) => r.json())
      .then((data) => {
        setConfigs(Array.isArray(data) ? data : []);
      })
      .catch(() => setConfigs([]))
      .finally(() => setLoading(false));
  }, []);

  /* ─── Sort ─────────────────────────────────────────────── */
  const sorted = useMemo(() => {
    const list = [...configs];
    switch (activeSort) {
      case "hot":
      case "top":
        list.sort((a, b) => b.upvoteCount - a.upvoteCount);
        break;
      case "new":
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }
    return list;
  }, [configs, activeSort]);

  /* ─── Filter ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = sorted;

    if (activeCategory !== "All") {
      const cat = activeCategory.toLowerCase();
      list = list.filter((c) =>
        c.tools.some((t) => t.category.toLowerCase().includes(cat)),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.author.name.toLowerCase().includes(q) ||
          c.tools.some((t) => t.name.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [sorted, activeCategory, searchQuery]);

  const showEmptyState = !loading && configs.length === 0;
  const showNoResults = !loading && configs.length > 0 && filtered.length === 0;

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

          {/* Category filter chips */}
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

          {/* Sort tabs */}
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
          {/* Loading skeleton */}
          {loading &&
            ["s1","s2","s3","s4","s5","s6","s7","s8"].map((k) => (
              <SkeletonCard key={k} />
            ))}

          {/* Real cards */}
          {!loading &&
            !showEmptyState &&
            filtered.map((config, i) => (
              <ConfigCard key={config.id} config={config} index={i} />
            ))}

          {/* Empty — no configs at all */}
          {showEmptyState && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted text-accent">
                <Grid3X3 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                No configurations yet
              </h2>
              <p className="mt-2 max-w-md text-muted-fg">
                Share your dotfiles with the community and help others discover
                great setups. Be the first!
              </p>
              <div className="mt-8 flex gap-3">
                <Button size="lg" asChild>
                  <Link href="/submit">Submit your dotfiles</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open GitHub
                  </Link>
                </Button>
              </div>

              {/* Preview cards */}
              <div className="mt-16 grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {["a", "b", "c", "d"].map((k) => (
                  <div
                    key={k}
                    className="rounded-xl border-2 border-dashed border-border/50 bg-surface/30 p-6 text-center opacity-60"
                  >
                    <div className="mb-3 aspect-[16/10] rounded-lg bg-surface-hover/50" />
                    <div className="space-y-2">
                      <div className="mx-auto h-3 w-3/4 rounded-full bg-surface-hover/50" />
                      <div className="mx-auto h-2 w-1/2 rounded-full bg-surface-hover/50" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtered — no results */}
          {showNoResults && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                No results
              </h2>
              <p className="mt-2 text-muted-fg">
                Try a different filter or search term.
              </p>
              <Button
                variant="secondary"
                className="mt-6"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
