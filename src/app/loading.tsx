import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted border border-border">
          <Loader2 className="h-6 w-6 text-accent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Loading DotHub...
          </p>
          <p className="text-xs text-muted-fg mt-0.5">
            Just a moment
          </p>
        </div>
      </div>
    </main>
  );
}
