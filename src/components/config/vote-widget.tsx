"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";

interface VoteWidgetProps {
  configId: string;
  initialCount: number;
}

export function VoteWidget({ configId, initialCount }: VoteWidgetProps) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggle(dir: "up" | "down") {
    if (busy) return;
    setBusy(true);
    // Optimistic
    const wasVoted = voted;
    const wasCount = count;
    if (voted === true) {
      setCount(count - 1);
      setVoted(null);
    } else {
      setCount(wasVoted === false ? count + 2 : count + 1);
      setVoted(true);
    }

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId }),
      });
      if (res.ok) {
        const data = await res.json();
        setVoted(data.voted);
        setCount(data.count);
      } else {
        // rollback
        setVoted(wasVoted);
        setCount(wasCount);
      }
    } catch {
      setVoted(wasVoted);
      setCount(wasCount);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
        Votes
      </h2>
      <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2">
        <button
          type="button"
          onClick={() => toggle("up")}
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

        <button
          type="button"
          onClick={() => toggle("down")}
          disabled={busy}
          className={`rounded-lg p-2 transition-all rotate-180 ${
            voted === false
              ? "bg-accent-muted text-accent"
              : "text-muted-fg hover:text-accent hover:bg-accent-muted/50"
          }`}
          aria-label="Downvote"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
