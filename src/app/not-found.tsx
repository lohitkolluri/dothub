import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RaccoonBig } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="min-h-screen pb-16">
      <div className="mx-auto max-w-lg px-4 pt-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <RaccoonBig />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            404
          </h1>
          <p className="mt-3 text-muted-fg leading-relaxed">
            This page doesn&apos;t exist — the config may have been removed, the
            URL might be wrong, or it never existed at all.
          </p>
          <div className="mt-10 flex gap-3">
            <Button size="lg" asChild>
              <Link href="/">Back to Gallery</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/explore">Explore</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
