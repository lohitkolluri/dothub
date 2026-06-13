import type { Metadata } from "next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProfilePageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle} — DotHub`,
    description: `Dotfiles and configurations shared by @${handle} on DotHub.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;

  // TODO: Fetch user profile from API
  // const user = await fetchUser(handle);
  // if (!user) notFound();

  return (
    <main className="min-h-screen pb-16">
      <div className="mx-auto max-w-4xl px-4 pt-16 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start sm:gap-6">
          <Avatar className="mb-4 h-20 w-20 sm:mb-0">
            <AvatarFallback className="text-lg">
              {handle[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{handle}</h1>
            <p className="mt-1 font-mono text-sm text-muted-fg">@{handle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-fg">
              <span>0 configs</span>
              <span aria-hidden="true">·</span>
              <span>0 upvotes</span>
            </div>
          </div>
        </div>

        {/* Configs */}
        <div>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-fg">
            Configurations
          </h2>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface">
              <span className="text-xl text-muted-fg">◇</span>
            </div>
            <p className="text-sm text-muted-fg">
              No configurations published yet.
            </p>
            <p className="mt-1 text-xs text-muted-fg">
              Configs submitted by @{handle} will appear here.
            </p>
            <Button className="mt-6" size="sm" asChild>
              <Link href="/submit">Submit a config</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
