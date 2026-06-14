import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GitBranch, MessageSquare, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VoteWidget } from "@/components/config/vote-widget";
import { ThreadedComments } from "@/components/config/threaded-comments";
import { ScreenshotViewer } from "@/components/config/screenshot-viewer";
import { RaccoonIcon } from "@/components/ui/logo";
import { getConfigById } from "@/lib/queries";
import { fetchGitHubFileList } from "@/lib/detection";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const config = await getConfigById(id);
  if (!config) return { title: "Not Found — DotHub" };

  return {
    title: `${config.title} — DotHub`,
    description: config.description,
    openGraph: config.screenshotUrl
      ? { images: [{ url: config.screenshotUrl }] }
      : undefined,
  };
}

/* ─── Category icon mapping ──────────────────────────────── */
const catIcons: Record<string, string> = {
  editor: "⌨", terminal: "▢", shell: "›",
  "window manager": "▣", bar: "▬", launcher: "⌕",
  theme: "◉", font: "A", notifications: "♦", browser: "◎",
};

/* ─── Tools table section ────────────────────────────────── */
function ToolsTable({ tools }: { tools: { name: string; category: string }[] }) {
  const grouped: Record<string, string[]> = {};
  for (const t of tools) {
    const cat = t.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t.name);
  }

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
        Software Stack
      </h2>
      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {Object.entries(grouped).map(([cat, names]) => (
          <div key={cat} className="flex items-center gap-3 px-4 py-3">
            <span className="w-5 text-center text-sm">{catIcons[cat] || "◇"}</span>
            <span className="w-28 text-sm font-medium capitalize text-foreground">
              {cat}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {names.map((n) => (
                <Badge key={n} variant="secondary" className="text-xs">
                  {n}
                </Badge>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="px-4 py-3 text-sm text-muted-fg">Not specified</div>
        )}
      </div>
    </section>
  );
}

/* ─── Color palette swatches ─────────────────────────────── */
function PaletteSection({ colors }: { colors?: string[] }) {
  if (!colors || colors.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
        Color Palette
      </h2>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <div key={c} className="group relative">
            <span
              className="block h-10 w-10 rounded-lg ring-1 ring-inset ring-border/50 transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
            />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
              {c}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── File language hint ─────────────────────────────────── */
function fileLang(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript", ts: "typescript", tsx: "tsx", jsx: "jsx",
    py: "python", rb: "ruby", rs: "rust", go: "go",
    lua: "lua", vim: "vim", json: "json", yml: "yaml", yaml: "yaml",
    toml: "toml", sh: "bash", bash: "bash", zsh: "bash",
    fish: "fish", nix: "nix", css: "css", html: "html",
    xml: "xml", md: "markdown", conf: "conf", cfg: "ini",
    ini: "ini", gitignore: "gitignore", editorconfig: "editorconfig",
  };
  return map[ext] ?? "";
}

/* ─── Files preview ──────────────────────────────────────── */
function FilePreview({
  files,
  repoUrl,
}: {
  files: { name: string; path: string; content: string; truncated?: boolean }[];
  repoUrl: string;
}) {
  if (!files || files.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
          Files
        </h2>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/30 py-12 text-center">
          <FileText className="mb-2 h-6 w-6 text-muted-fg/40" />
          <p className="text-sm text-muted-fg">No config files previewed</p>
          <p className="mt-1 text-xs text-muted-fg/60">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-accent"
            >
              Browse on GitHub
            </a>{" "}
            to explore the full repository.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
        Files
      </h2>
      <div className="space-y-6">
        {files.map((file) => {
          const lines = file.content.split("\n");
          const truncated = file.truncated || file.content.endsWith("...\n...") || file.content.endsWith("...");
          return (
            <div
              key={file.path}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-border bg-surface-hover px-4 py-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-muted-fg truncate">
                    {file.path}
                  </span>
                  {fileLang(file.path) && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                      {fileLang(file.path)}
                    </Badge>
                  )}
                  {truncated && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 border-amber-500/30 text-amber-600 dark:text-amber-400">
                      Truncated
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-fg tabular-nums hidden sm:inline">
                    {lines.length} lines
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <a
                      href={`${repoUrl}/blob/main/${file.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Raw
                    </a>
                  </Button>
                </div>
              </div>

              {/* Code area with line numbers */}
              <div className="flex max-h-96 overflow-auto">
                {/* Line numbers gutter */}
                <div className="select-none border-r border-border bg-surface-hover/50 py-4 text-right" style={{ minWidth: "3rem" }}>
                  {lines.map((_, i) => (
                    <div
                      key={`${file.path}-${i}`}
                      className="pr-3 text-[11px] leading-[1.65] text-muted-fg/40 tabular-nums"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Code content */}
                <pre className="flex-1 overflow-x-auto p-4 text-sm leading-[1.65]">
                  <code className="font-mono text-foreground whitespace-pre-wrap break-all">
                    {file.content}
                  </code>
                </pre>
              </div>

              {/* Truncation footer */}
              {truncated && (
                <div className="border-t border-border bg-surface-hover/30 px-4 py-2 text-center">
                  <a
                    href={`${repoUrl}/blob/main/${file.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-fg hover:text-accent transition-colors underline"
                  >
                    View full file on GitHub →
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Install command ────────────────────────────────────── */
function InstallBlock({
  command,
  repoUrl,
}: {
  command?: string | null;
  repoUrl: string;
}) {
  const cmd =
    command ||
    `git clone ${repoUrl} ~/dotfiles\ncd ~/dotfiles\nstow .`;

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
        Quick Install
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border bg-surface-hover px-4 py-2">
          <span className="font-mono text-xs text-muted-fg">bash</span>
        </div>
        <pre className="overflow-x-auto p-4 text-sm">
          <code className="font-mono text-foreground">{cmd}</code>
        </pre>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default async function ConfigDetailPage({ params }: Props) {
  const { id } = await params;
  const config = await getConfigById(id);

  if (!config) notFound();

  let files: { name: string; path: string; content: string; truncated?: boolean }[] = [];
  try {
    const { files: repoFiles, error } = await fetchGitHubFileList(config.repoUrl);
    if (error) {
      console.warn("GitHub file list fetch skipped:", error);
    } else if (repoFiles.length > 0) {
      const match = config.repoUrl.match(/github\.com[/:]([^/]+)\/([^/\s#?]+?)(?:\.git)?(?:\/|$)/);
      const [, owner, repo] = match || [];
      if (owner && repo) {
        // Focus on dotfiles and config — skip generated/build dirs
        const filtered = repoFiles.filter((p: string) => {
          const lower = p.toLowerCase();
          if (lower.includes("node_modules") || lower.includes(".git") || lower.includes("__pycache__")) return false;
          if (lower.startsWith(".")) return true;
          if (/\b(init|config|settings)\.(lua|vim|json|yml|yaml|toml|conf)$/i.test(p)) return true;
          if (/\.(bashrc|zshrc|profile|bash_profile|zprofile|gitconfig|tmux\.conf)$/i.test(p)) return true;
          return lower.startsWith(".") || (lower.includes("config") && !lower.includes("node_modules"));
        }).slice(0, 8);

        for (const path of filtered) {
          try {
            const contentRes = await fetchWithTimeout(
              `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
              { timeout: 5000, headers: { Accept: "application/vnd.github+json" } },
            );
            if (!contentRes.ok) {
              if (contentRes.status === 403) continue; // rate limited, skip silently
              if (contentRes.status === 404) continue; // file moved, skip
              continue;
            }
            const data = await contentRes.json();
            // Skip non-file entries (dirs, symlinks, submodules)
            if (data.type !== "file") continue;
            // Skip non-base64 encoding
            if (data.encoding !== "base64" || !data.content) continue;
            // Try to decode; skip if binary garbage
            let decoded: string;
            try {
              decoded = Buffer.from(data.content, "base64").toString("utf-8");
              // Quick binary detection: check for null bytes
              if (decoded.includes("\u0000")) continue;
            } catch {
              continue; // not valid base64/utf-8
            }
            // Truncate long content
            const MAX_CHARS = 4000;
            const MAX_LINES = 60;
            let truncated = false;
            if (decoded.length > MAX_CHARS) {
              decoded = decoded.slice(0, MAX_CHARS);
              truncated = true;
            }
            const lineArr = decoded.split("\n");
            if (lineArr.length > MAX_LINES) {
              decoded = lineArr.slice(0, MAX_LINES).join("\n");
              truncated = true;
            }
            if (truncated) decoded += "\n\n/* … truncated … */";
            files.push({ name: path.split("/").pop() ?? path, path, content: decoded, truncated });
          } catch {
            // Individual file fetch failed; skip this file, continue with others
            continue;
          }
        }
      }
    }
  } catch (e) {
    // Entire fetch batch failed — files stays empty, UI falls back to "No files" state
    console.warn("GitHub file preview unavailable:", e);
  }

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* ─── Breadcrumb ──────────────────────────────── */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-fg">
          <Link href="/" className="hover:text-foreground transition-colors">
            Gallery
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-foreground">{config.title}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* ── Left column ────────────────────────────── */}
          <div>
            {/* Screenshot */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-surface-muted">
              {config.screenshotUrl ? (
                <ScreenshotViewer src={config.screenshotUrl} alt={config.title} />
              ) : (
                <div className="flex flex-col items-center gap-3 py-16">
                  <RaccoonIcon size={64} className="text-muted-fg/20" />
                  <p className="text-sm text-muted-fg">
                    No screenshot yet
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {config.title}
              </h1>
              {config.description && (
                <p className="mt-3 text-muted-fg leading-relaxed">
                  {config.description}
                </p>
              )}
            </div>

            {/* Files */}
            <div className="mb-10">
              <FilePreview files={files} repoUrl={config.repoUrl} />
            </div>

            {/* Install */}
            <div className="mb-10">
              <InstallBlock
                command={config.installCommand}
                repoUrl={config.repoUrl}
              />
            </div>
          </div>

          {/* ── Right sidebar ──────────────────────────── */}
          <aside className="space-y-8">
            {/* Vote widget */}
            <VoteWidget configId={config.id} initialCount={config.upvoteCount} />

            {/* Author */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
                Author
              </h2>
              <Link
                href={`/profile/${config.author.handle}`}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={config.author.image ?? undefined} />
                  <AvatarFallback className="bg-accent-muted text-accent">
                    {config.author.name?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {config.author.name}
                  </p>
                  <p className="text-xs text-muted-fg">@{config.author.handle}</p>
                </div>
              </Link>
            </section>

            {/* Date */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
                Published
              </h2>
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="h-4 w-4 text-muted-fg" />
                {config.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </section>

            {/* Source */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
                Source
              </h2>
              <Button variant="secondary" size="sm" className="w-full" asChild>
                <a
                  href={config.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  View on GitHub
                </a>
              </Button>
            </section>

            {/* Tools table */}
            <ToolsTable tools={config.tools} />

            {/* Palette */}
            {/* palette not in schema yet — pass empty for now */}
            <PaletteSection />
          </aside>
        </div>

        {/* ─── Below the fold: comments ──────────────────── */}
        <section id="comments" className="mt-16 border-t border-border pt-10 max-w-3xl">
          <h2 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-fg" />
            Discussion
          </h2>
          <ThreadedComments configId={config.id} />
        </section>
      </div>
    </main>
  );
}
