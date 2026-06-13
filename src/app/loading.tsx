import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-accent h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading DotHub...</p>
      </div>
    </div>
  );
}
