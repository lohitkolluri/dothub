"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MessageSquare, Eye } from "lucide-react";

interface ConfigTabsProps {
  configId: string;
}

const TABS = [
  { id: "overview", label: "Overview", icon: Eye, href: "" },
  { id: "discussion", label: "Discussion", icon: MessageSquare, href: "?tab=discussion" },
];

export function ConfigTabs({ configId }: ConfigTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") === "discussion" ? "discussion" : "overview";

  return (
    <div className="mb-6 flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const href = tab.href ? `${pathname}${tab.href}` : pathname;
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            replace
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-fg hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}