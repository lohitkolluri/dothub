import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Submit — DotHub",
  description: "Share your dotfiles configuration with the community.",
};

export default function SubmitPage() {
  return (
    <main className="min-h-screen pb-16">
      <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Submit your dotfiles
        </h1>
        <p className="mt-3 text-muted-fg leading-relaxed">
          Share a developer tool configuration you&apos;re proud of.
          Include a screenshot, link the repo, and tag the tools you used.
        </p>

        {/* ─── Form placeholder ─────────────────────────── */}
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface/50 px-8 py-24 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface">
            <span className="text-xl text-muted-fg">+</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Form coming soon</h2>
          <p className="mt-1 max-w-md text-sm text-muted-fg">
            The submit form is being built. For now, you can open a
            pull request or create an issue on GitHub.
          </p>
          <div className="mt-8 flex gap-3">
            <Button variant="secondary" asChild>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                Open an Issue
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">Back to Gallery</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
