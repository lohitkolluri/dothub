import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ChevronUp, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserByHandle } from "@/lib/queries";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle} — DotHub`,
    description: `Dotfiles and configurations shared by @${handle} on DotHub.`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await getUserByHandle(handle);

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen pb-16">
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* ─── Profile header ────────────────────────── */}
        <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start sm:gap-6">
          <Avatar className="mb-4 h-20 w-20 sm:mb-0">
            <AvatarImage src={profile.image ?? undefined} />
            <AvatarFallback className="text-lg bg-accent-muted text-accent">
              {profile.name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {profile.name ?? handle}
            </h1>
            <p className="mt-1 font-mono text-sm text-muted-fg">@{handle}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-fg sm:justify-start">
              <span>{profile.configCount} configs</span>
              <span aria-hidden="true">·</span>
              <span>{profile.totalUpvotes} upvotes</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" asChild className="shrink-0">
            <Link href="/submit">Submit a config</Link>
          </Button>
        </div>

        {/* ─── Configs ───────────────────────────────── */}
        <div>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-fg">
            Configurations
          </h2>

          {profile.configs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface">
                <span className="text-xl text-muted-fg">◇</span>
              </div>
              <p className="text-sm text-muted-fg">
                No configurations published yet.
              </p>
              <Button className="mt-6" size="sm" asChild>
                <Link href="/submit">Submit a config</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.configs.map((c) => (
                <Link
                  key={c.id}
                  href={`/configs/${c.id}`}
                  className="group block rounded-xl border border-border bg-surface p-5 transition-all hover:border-accent/30 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                        {c.title}
                      </h3>
                      {c.description && (
                        <p className="mt-1 text-sm text-muted-fg line-clamp-2">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-sm text-muted-fg">
                      <span className="flex items-center gap-1">
                        <ChevronUp className="h-3.5 w-3.5" />
                        {c.upvoteCount}
                      </span>
                      <span className="text-xs" aria-hidden="true">·</span>
                      <time className="text-xs">
                        {c.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
