"use client";

import { useVote } from "@/lib/use-vote";
import { ChevronUp } from "lucide-react";

interface VoteWidgetProps {
  configId: string;
  initialCount: number;
}

export function VoteWidget({ configId, initialCount }: VoteWidgetProps) {
  const { count, voted, busy, toggle } = useVote(configId, initialCount);

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
        Votes
      </h2>
      <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`rounded-lg p-2 transition-all ${
            voted
              ? "bg-accent-muted text-accent"
              : "text-muted-fg hover:text-accent hover:bg-accent-muted/50"
          }`}
          aria-label="Upvote"
        >
          <ChevronUp className="h-5 w-5" />
        </button>

        <span className="min-w-[3ch] text-center text-base font-bold tabular-nums text-foreground">
          {count}
        </span>
      </div>
    </section>
  );
}
