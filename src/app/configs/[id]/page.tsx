import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ConfigPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ConfigPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Config #${id} — DotHub`,
    description: `Dotfiles configuration shared on DotHub.`,
  };
}

export default async function ConfigDetailPage({ params }: ConfigPageProps) {
  const { id } = await params;

  // TODO: Fetch config from API
  // const config = await fetchConfig(id);
  // if (!config) notFound();

  return (
    <main className="min-h-screen pb-16">
      <div className="mx-auto max-w-4xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface">
            <span className="text-2xl text-muted-fg">◇</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Config not yet loaded
          </h1>
          <p className="mt-2 max-w-sm text-muted-fg">
            This configuration hasn&apos;t been published yet or is being
            fetched from the database.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild>
              <Link href="/">Back to Gallery</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/submit">Submit your own</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
