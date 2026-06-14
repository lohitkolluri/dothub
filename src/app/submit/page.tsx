"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useState, useRef } from "react";
import {
  Loader2, Upload, Link as LinkIcon, Check, AlertCircle,
  X, ChevronRight, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signIn } from "next-auth/react";

/* ─── Category icons (same as detail page) ──────────────── */
const catIcons: Record<string, string> = {
  editor: "⌨", terminal: "▢", shell: "›",
  window_manager: "▣", bar: "▬", launcher: "⌕",
  theme: "◉", font: "A", notifications: "♦", browser: "◎",
  compositor: "◇", file_manager: "📁", media: "🎵",
  monitor: "📊", mail: "✉", misc: "⚙",
};

export default function SubmitPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);

  /* ─── Form state ──────────────────────────────────────── */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [installCommand, setInstallCommand] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detected, setDetected] = useState<{ name: string; category: string }[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("misc");

  const toolCategories = [
    "terminal", "shell", "editor", "window_manager", "bar",
    "launcher", "compositor", "notification", "theme", "font",
    "mail", "browser", "file_manager", "media", "monitor", "misc",
  ];

  const addManualTool = useCallback(() => {
    const name = manualName.trim();
    if (!name) return;
    if (detected.some((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    setDetected((prev) => [...prev, { name, category: manualCategory }]);
    setManualName("");
  }, [manualName, manualCategory, detected]);

  /* ─── Async state ─────────────────────────────────────── */
  const [detecting, setDetecting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── Image handler ──────────────────────────────────── */
  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  /* ─── Tool detection ──────────────────────────────────── */
  const detectTools = useCallback(async () => {
    if (!repoUrl.trim()) return;
    setDetecting(true);
    setError(null);
    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Detection failed");
        return;
      }
      const data = await res.json();
      setDetected(data.tools || []);
    } catch {
      setError("Failed to analyze repository");
    } finally {
      setDetecting(false);
    }
  }, [repoUrl]);

  /* ─── Submit ──────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !repoUrl.trim()) return;
    setSubmitting(true);
    setError(null);

    let screenshotUrl: string | null = null;

    // Upload image if provided
    if (screenshot) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", screenshot);
      try {
        const upRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          screenshotUrl = upData.url;
        } else {
          const upErr = await upRes.json();
          setError(upErr.error || "Image upload failed");
          setSubmitting(false);
          setUploading(false);
          return;
        }
      } catch {
        setError("Image upload failed");
        setSubmitting(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Create config
    try {
      const res = await fetch("/api/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          repoUrl: repoUrl.trim(),
          installCommand: installCommand.trim() || undefined,
          screenshotUrl,
          tools: detected,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Submission failed");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      router.push(`/configs/${data.id}`);
    } catch {
      setError("Submission failed");
      setSubmitting(false);
    }
  }, [title, description, repoUrl, installCommand, screenshot, detected, router]);

  /* ─── Wizards are not allowed ─────────────────────────── */
  if (!session?.user) {
    return (
      <main className="min-h-screen pb-16">
        <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border bg-surface/30">
            <h1 className="text-2xl font-bold text-foreground">Sign in to submit</h1>
            <p className="mt-2 text-muted-fg">
              You need a GitHub account to share your dotfiles with the community.
            </p>
            <Button className="mt-8" size="lg" onClick={() => signIn("github")}>
              Sign in with GitHub
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* ─── Header ────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Submit your dotfiles
          </h1>
          <p className="mt-2 text-muted-fg leading-relaxed">
            Share a developer tool configuration you&apos;re proud of.
            We&apos;ll analyze the repo and detect your tools automatically.
          </p>
        </div>

        {/* ─── Form ──────────────────────────────────── */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-foreground">
              Title <span className="text-accent">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neovim IDE — Rust & TypeScript"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-fg focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="desc" className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this setup special? What tools, workflows, or aesthetics does it cover?"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-fg focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </div>

          {/* Repo URL + Detect */}
          <div>
            <label htmlFor="repo" className="mb-1.5 block text-sm font-medium text-foreground">
              GitHub Repository <span className="text-accent">*</span>
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
                <input
                  id="repo"
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/dotfiles"
                  className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-fg focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all"
                />
              </div>
              <Button
                variant="secondary"
                onClick={detectTools}
                disabled={!repoUrl.trim() || detecting}
              >
                {detecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Detect"
                )}
              </Button>
            </div>
          </div>

          {/* Detected tools */}
          {detected.length > 0 && (
            <div>
            <p className="mb-2 block text-sm font-medium text-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              Detected tools ({detected.length})
            </p>
              <div className="divide-y divide-border rounded-xl border border-border bg-surface">
                {detected.map((t) => (
                  <div key={t.name} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-sm">{catIcons[t.category] || "◇"}</span>
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {t.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {t.category.replace(/_/g, " ")}
                    </Badge>
                    <button
                      type="button"
                      onClick={() =>
                        setDetected((prev) => prev.filter((x) => x.name !== t.name))
                      }
                      className="text-muted-fg hover:text-foreground transition-colors"
                      aria-label={`Remove ${t.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Manual tool entry ──────────────────────── */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-3 text-sm font-medium text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" />
              Add a tool manually
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManualTool()}
                placeholder="Tool name (e.g. starship)"
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-fg focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all"
              />
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-40 rounded-lg border border-border bg-surface-muted px-2.5 py-2 text-sm text-foreground focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all capitalize"
              >
                {toolCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {catIcons[cat] || "◇"} {cat.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={addManualTool}
                disabled={!manualName.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Install command */}
          <div>
            <label htmlFor="install" className="mb-1.5 block text-sm font-medium text-foreground">
              Install command (optional)
            </label>
            <input
              id="install"
              type="text"
              value={installCommand}
              onChange={(e) => setInstallCommand(e.target.value)}
              placeholder="e.g. stow . or chezmoi init --apply"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-fg font-mono focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </div>

          {/* Screenshot upload */}
          <div>
            <p className="mb-1.5 block text-sm font-medium text-foreground">
              Screenshot
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface/50 px-6 py-10 text-center transition-all hover:border-accent/50 hover:bg-accent-muted/20"
            >
              {previewUrl ? (
                <div className="relative w-full max-w-md">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-lg border border-border object-cover max-h-64 w-full"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScreenshot(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background shadow-sm"
                    aria-label="Remove screenshot"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-3 h-8 w-8 text-muted-fg/40" />
                  <p className="text-sm font-medium text-foreground">
                    Click to upload a screenshot
                  </p>
                  <p className="mt-1 text-xs text-muted-fg">
                    16:9 ratio recommended · PNG or JPEG
                  </p>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onFileSelect}
              className="hidden"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-muted/30 px-4 py-3 text-sm text-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!title.trim() || !repoUrl.trim() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploading ? "Uploading image…" : "Submitting…"}
                </>
              ) : (
                <>
                  Publish to Gallery
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
