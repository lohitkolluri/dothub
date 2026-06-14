"use client";

import { useState, useCallback, useEffect } from "react";
import { Expand, X } from "lucide-react";

interface ScreenshotViewerProps {
  src: string;
  alt: string;
}

export function ScreenshotViewer({ src, alt }: ScreenshotViewerProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);
  useEffect(() => {
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, handleKey]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface-muted">
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain max-h-[500px]"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-background/70 text-muted-fg opacity-0 backdrop-blur-sm transition-all hover:bg-background/90 hover:text-foreground group-hover:opacity-100"
          aria-label="View full size"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>

      {/* Lightbox overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}