import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUp, GitBranch, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VoteWidget } from "@/components/config/vote-widget";
import { getConfigById } from "@/lib/queries";

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

/* ─── Files preview ──────────────────────────────────────── */
function FilePreview({
  files,
  repoUrl,
}: {
  files: { name: string; path: string; content: string }[];
  repoUrl: string;
}) {
  if (!files || files.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-fg">
        Files
      </h2>
      <div className="space-y-4">
        {files.map((file) => (
          <div
            key={file.path}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="flex items-center justify-between border-b border-border bg-surface-hover px-4 py-2">
              <span className="font-mono text-xs text-muted-fg">{file.path}</span>
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
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
              <code className="font-mono text-foreground">{file.content}</code>
            </pre>
          </div>
        ))}
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

  // Mock files until the API stores them
  const files: { name: string; path: string; content: string }[] = [];

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
            <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-surface-muted aspect-[16/9] flex items-center justify-center">
              {config.screenshotUrl ? (
                <img
                  src={config.screenshotUrl}
                  alt={config.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <span className="text-5xl text-muted-fg/20">◆</span>
                  <p className="mt-3 text-sm text-muted-fg">
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

        {/* ─── Below the fold: comments placeholder ───────── */}
        <section
          id="comments"
          className="mt-16 border-t border-border pt-10 max-w-3xl"
        >
          <h2 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-fg" />
            Discussion
          </h2>
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border bg-surface/30">
            <p className="text-sm text-muted-fg">
              Comments are coming soon.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
