"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useVote } from "@/lib/use-vote";
import { MessageSquare, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ConfigCardData = {
  id: string;
  title: string;
  description: string;
  author: { name: string; handle: string; avatar?: string };
  tools: { name: string; category: string }[];
  upvoteCount: number;
  commentCount: number;
  screenshotUrl?: string;
  palette?: string[];
  createdAt: string;
};

interface ConfigCardProps {
  config: ConfigCardData;
  index?: number;
}

/* ─── Palette swatch row ────────────────────────────────── */
function PaletteSwatches({ colors }: { colors: string[] }) {
  if (!colors.length) return null;
  return (
    <div className="flex gap-1 px-4 pb-3">
      {colors.map((c) => (
        <span
          key={c}
          className="block h-4 w-4 rounded-full ring-1 ring-inset ring-border/40"
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  );
}

/* ─── Thumbnail placeholder (blur-up skeleton) ─────────── */
function Thumbnail({
  url,
  title,
  index,
}: {
  url?: string;
  title: string;
  index: number;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-surface-hover">
      {/* Skeleton pulse */}
      {!loaded && !url && (
        <div className="absolute inset-0 animate-pulse bg-surface-hover/60" />
      )}

      {url ? (
        <img
          src={url}
          alt={title}
          loading={index < 4 ? undefined : "lazy"}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-all duration-700 ${
            loaded
              ? "scale-100 blur-0 opacity-100"
              : "scale-105 blur-lg opacity-60"
          }`}
        />
      ) : (
        /* No-screenshot placeholder */
        <div className="flex h-full items-center justify-center">
          <span className="text-3xl text-muted-fg/30">◆</span>
        </div>
      )}
    </div>
  );
}

/* ─── Vote button ───────────────────────────────────────── */
function VoteButton({
  configId,
  initialCount,
}: {
  configId: string;
  initialCount: number;
}) {
  const { count, voted, busy, toggle } = useVote(configId, initialCount);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
        voted
          ? "bg-accent-muted text-accent"
          : "text-muted-fg hover:text-accent hover:bg-accent-muted/50"
      }`}
      aria-label={voted ? "Remove upvote" : "Upvote"}
    >
      <ChevronUp className="h-3.5 w-3.5" />
      {count}
    </button>
  );
}

/* ─── ConfigCard ────────────────────────────────────────── */
export const ConfigCard = React.memo(function ConfigCard({ config, index = 0 }: ConfigCardProps) {
  return (
    <article
      className="group relative overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/30"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Link wrapping the card body */}
      <Link href={`/configs/${config.id}`} className="block">
        {/* Screenshot / placeholder */}
        <Thumbnail url={config.screenshotUrl} title={config.title} index={index} />

        {/* Palette swatches */}
        {config.palette && config.palette.length > 0 && (
          <PaletteSwatches colors={config.palette} />
        )}

        {/* Text content */}
        <div className="px-4 pb-3">
          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {config.title}
          </h3>
          {config.description && (
            <p className="mt-0.5 text-xs text-muted-fg line-clamp-2 leading-relaxed">
              {config.description}
            </p>
          )}
        </div>
      </Link>

      {/* Bottom row: vote + comments + tools */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <VoteButton configId={config.id} initialCount={config.upvoteCount} />

        <div className="flex items-center gap-2">
          <Link
            href={`/configs/${config.id}#comments`}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-fg hover:text-foreground hover:bg-surface-hover transition-all"
          >
            <MessageSquare className="h-3 w-3" />
            {config.commentCount}
          </Link>

          {config.tools.slice(0, 3).map((t) => (
            <Badge key={t.name} variant="secondary" className="text-[10px] px-1.5 py-0">
              {t.name}
            </Badge>
          ))}
          {config.tools.length > 3 && (
            <span className="text-[10px] text-muted-fg font-medium">
              +{config.tools.length - 3}
            </span>
          )}
        </div>
      </div>
    </article>
  );
});
