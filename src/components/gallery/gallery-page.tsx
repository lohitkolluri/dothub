"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Grid3X3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfigCard, type ConfigCardData } from "./config-card";

// Sort options – map to API query param
const sorts = [
  { key: "hot", label: "Hot" },
  { key: "top", label: "Top" },
  { key: "new", label: "New" },
] as const;

/* ─── Types ─────────────────────────────────────── */
type Tag = {
  id: string;
  name: string;
  slug: string;
  configCount: number;
};

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
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL‑derived state
  const [activePage, setActivePage] = useState<number>(1);
  const [activeSort, setActiveSort] = useState<"hot" | "top" | "new">("hot");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTag, setActiveTag] = useState<string>(""); // empty = all

  // Data
  const [configs, setConfigs] = useState<ConfigCardData[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
  });

  // ---------------------------------------------------------------------
  // Sync state from URL on mount / navigation (back‑forward support)
  // ---------------------------------------------------------------------
  useEffect(() => {
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const sort = (searchParams.get("sort") ?? "hot") as "hot" | "top" | "new";
    const q = searchParams.get("q") ?? "";
    const tag = searchParams.get("tag") ?? "";
    setActivePage(page);
    setActiveSort(sort);
    setSearchQuery(q);
    setActiveTag(tag);
  }, [searchParams]);

  // ---------------------------------------------------------------------
  // Fetch tags (once)
  // ---------------------------------------------------------------------
  useEffect(() => {
    fetch("/api/tags")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => setTags([]));
  }, []);

  // ---------------------------------------------------------------------
  // Fetch configs whenever query‑related state changes
  // ---------------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(activePage));
    params.set("limit", String(pagination.limit));
    params.set("sort", activeSort);
    if (searchQuery) params.set("q", searchQuery);
    if (activeTag) params.set("tag", activeTag);
    fetch(`/api/configs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setConfigs(data.data ?? []);
        setPagination(data.pagination ?? { page: activePage, limit: pagination.limit, total: 0, totalPages: 0 });
      })
      .catch(() => {
        setConfigs([]);
        setPagination({ page: activePage, limit: pagination.limit, total: 0, totalPages: 0 });
      })
      .finally(() => setLoading(false));
  }, [activePage, activeSort, searchQuery, activeTag]);

  // ---------------------------------------------------------------------
  // Debounced search – updates URL (which triggers fetch via the effect above)
  // ---------------------------------------------------------------------
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("q", searchQuery);
      } else {
        params.delete("q");
      }
      params.set("page", "1"); // reset to first page on new search
      router.replace(`?${params.toString()}`);
    }, 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ---------------------------------------------------------------------
  // Handlers that update URL directly (tag, sort, pagination)
  // ---------------------------------------------------------------------
  const handleTagClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("tag", slug);
    } else {
      params.delete("tag");
    }
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const handleSortClick = (key: "hot" | "top" | "new") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  };

  const showEmptyState = !loading && pagination.total === 0;
  const showNoResults = !loading && pagination.total > 0 && configs.length === 0;

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

          {/* Tag filter chips */}
          <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Badge
              variant={activeTag === "" ? "default" : "secondary"}
              className="cursor-pointer shrink-0"
              onClick={() => handleTagClick("")}
            >
              All
            </Badge>
            {tags.map((tag) => (
              <Badge
                key={tag.slug}
                variant={activeTag === tag.slug ? "default" : "secondary"}
                className="cursor-pointer shrink-0"
                onClick={() => handleTagClick(tag.slug)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>

          {/* Sort tabs */}
          <div className="flex items-center gap-1 text-sm">
            {sorts.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => handleSortClick(s.key)}
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
            ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((k) => (
              <SkeletonCard key={k} />
            ))}

          {/* Real cards */}
          {!loading && !showEmptyState && configs.map((config, i) => (
            <ConfigCard key={config.id} config={config} index={i} />
          ))}

          {/* Empty — no configs at all */}
          {showEmptyState && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted text-accent">
                <Grid3X3 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">No configurations yet</h2>
              <p className="mt-2 max-w-md text-muted-fg">
                Share your dotfiles with the community and help others discover great setups. Be the first!
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
              <h2 className="text-xl font-semibold text-foreground">No results</h2>
              <p className="mt-2 text-muted-fg">Try a different filter or search term.</p>
              <Button variant="secondary" className="mt-6" onClick={() => {
                // Reset all filters
                const params = new URLSearchParams();
                router.replace(`?${params.toString()}`);
              }}>
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage <= 1}
            >
              Prev
            </Button>
            {Array.from({ length: pagination.totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <Button
                  key={pageNum}
                  variant={activePage === pageNum ? "default" : "secondary"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
