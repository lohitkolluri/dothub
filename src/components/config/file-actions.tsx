"use client";

import { useState, useCallback } from "react";
import { Copy, Download, Check } from "lucide-react";

interface FileActionsProps {
  content: string;
  filename: string;
}

export function FileActions({ content, filename }: FileActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently fail
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, filename]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-fg hover:text-foreground hover:bg-surface-hover transition-colors"
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        title={copied ? "Copied" : "Copy"}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-fg hover:text-foreground hover:bg-surface-hover transition-colors"
        aria-label="Download file"
        title="Download"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}