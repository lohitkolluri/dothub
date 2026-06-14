'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RaccoonIcon } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { href: '/explore', label: 'Explore' },
  { href: '/submit', label: 'Submit' },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="group ml-1 flex items-center gap-2.5 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <RaccoonIcon
              size={28}
              className="text-foreground transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-base tracking-tight">DotHub</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm transition-all duration-200',
                  pathname === link.href
                    ? 'bg-surface-hover text-foreground font-medium'
                    : 'text-muted-fg hover:text-foreground hover:bg-surface-hover/50',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-muted-fg hover:text-foreground hover:bg-surface-hover transition-all"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <span className="inline-block h-4 w-4" aria-hidden />
            )}
          </button>
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="outline-none">
                  <Avatar className="h-8 w-8 ring-1 ring-border ring-offset-1 ring-offset-background transition-shadow hover:ring-border-hover">
                    <AvatarImage
                      src={session.user.image ?? undefined}
                      alt={session.user.name ?? ''}
                    />
                    <AvatarFallback className="text-xs font-medium">
                      {session.user.name?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">{session.user.name}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={session.user.handle ? `/profile/${session.user.handle}` : '/settings'}
                  >
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => signIn('github')}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
