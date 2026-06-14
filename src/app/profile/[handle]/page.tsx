import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ChevronUp, ExternalLink, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RaccoonPlaceholder } from "@/components/ui/logo";
import { getUserByHandle } from "@/lib/queries";
import { auth } from "@/lib/auth";

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
  const session = await auth();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === profile.id;

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

            {/* Bio */}
            {profile.bio && (
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-fg">
                {profile.bio}
              </p>
            )}

            {/* Stats row */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-fg sm:justify-start">
              <span className="font-medium text-foreground">{profile.configCount} configs</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-foreground">{profile.totalUpvotes} upvotes</span>
              <span aria-hidden="true">·</span>
              <a
                href={`https://github.com/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              {profile.createdAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {profile.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 flex-col gap-2">
            {isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Settings className="mr-1.5 h-4 w-4" />
                  Edit profile
                </Link>
              </Button>
            )}
            <Button variant="secondary" size="sm" asChild>
              <Link href="/submit">Submit a config</Link>
            </Button>
          </div>
        </div>

        {/* ─── Configs ───────────────────────────────── */}
        <div>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-fg">
            Configurations
          </h2>

          {profile.configs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface">
                <RaccoonPlaceholder size={20} />
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
