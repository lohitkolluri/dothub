"use client";
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    if (session?.user) {
      setName((session.user as { name?: string }).name ?? "");
      setBio((session.user as { bio?: string }).bio ?? "");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-fg" />
      </main>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetchWithTimeout("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen pb-16">
      <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href={`/profile/${(session?.user as { handle?: string })?.handle ?? ""}`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <div className="mb-8 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="bg-accent-muted text-accent">
              {session?.user?.name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold text-foreground">Profile settings</h1>
            <p className="text-sm text-muted-fg">
              @{(session?.user as { handle?: string })?.handle ?? ""}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Display name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about yourself"
              className="w-full resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
            <p className="mt-1 text-xs text-muted-fg">
              Markdown is not supported. Max 500 characters.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-accent/30 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
              {error}
            </p>
          )}

          {saved && (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
              Profile updated successfully.
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
