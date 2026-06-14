"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted/50">
          <AlertCircle className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-fg leading-relaxed">
          An unexpected error occurred while loading this page. It&apos;s probably
          not your fault — try again or head back to the gallery.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={() => reset()}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Try again
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/">
              <Home className="mr-1.5 h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-6 text-[10px] text-muted-fg/50 font-mono">
            Error ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
