"use client";
import { useState, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export function useVote(configId: string, initialCount: number) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetchWithTimeout("/api/vote", { timeout: 5000,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId }),
      });
      if (res.ok) {
        const data = await res.json();
        setVoted(data.voted);
        setCount(data.count);
      }
    } catch (err) {
      console.error("Vote error:", err);
    } finally {
      setBusy(false);
    }
  }, [configId, busy]);

  return { count, voted, busy, toggle };
}
