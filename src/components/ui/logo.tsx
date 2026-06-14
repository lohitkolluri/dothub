import { cn } from '@/lib/utils';

/* ── Raccoon mark ─────────────────────────────────────────── */

interface IconProps {
  className?: string;
  size?: number;
}

const FUR = 'fill-muted-fg';
const DARK = 'fill-zinc-900 dark:fill-zinc-900';
const LIGHT = 'fill-white';

export function RaccoonIcon({ className, size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role="img"
      aria-label="DotHub"
    >
      {/* Fur — ears & head */}
      <path d="M22,44 L10,12 L32,28 Z" className={FUR} />
      <path d="M78,44 L90,12 L68,28 Z" className={FUR} />
      <ellipse cx="50" cy="54" rx="38" ry="34" className={FUR} />

      {/* Inner ears */}
      <path d="M22,40 L16,24 L30,32 Z" className={LIGHT} />
      <path d="M78,40 L84,24 L70,32 Z" className={LIGHT} />

      {/* Bandit mask — teardrop patches meeting at the bridge */}
      <path
        d="M10,54
           C10,40 20,34 32,38
           C38,42 40,50 36,56
           C30,64 10,62 10,54 Z
           M90,54
           C90,40 80,34 68,38
           C62,42 60,50 64,56
           C70,64 90,62 90,54 Z
           M38,36
           C44,32 56,32 62,36
           C58,44 42,44 38,36 Z"
        className={DARK}
      />

      {/* Muzzle */}
      <circle cx="50" cy="70" r="15" className={LIGHT} />

      {/* Eyes */}
      <circle cx="32" cy="50" r="4.5" className={LIGHT} />
      <circle cx="68" cy="50" r="4.5" className={LIGHT} />
      <circle cx="32" cy="50" r="2.5" className={DARK} />
      <circle cx="68" cy="50" r="2.5" className={DARK} />
      <circle cx="31" cy="49" r="0.9" className={LIGHT} />
      <circle cx="67" cy="49" r="0.9" className={LIGHT} />

      {/* Nose */}
      <ellipse cx="50" cy="70" rx="4.5" ry="3.2" className={DARK} />
    </svg>
  );
}

/* ── Full logo: mark + wordmark ───────────────────────────── */

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight',
        className,
      )}
    >
      <RaccoonIcon size={26} />
      <span className="text-base tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
        DotHub
      </span>
    </span>
  );
}

/* ── Large mark for empty states / 404 ────────────────────── */

export function RaccoonBig({ className, size = 80 }: IconProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-3xl border-2 border-dashed border-border bg-surface/50',
        className,
      )}
      style={{ width: size + 32, height: size + 32 }}
    >
      <RaccoonIcon size={size} />
    </div>
  );
}

/* ── Small mark for card placeholders ─────────────────────── */

export function RaccoonPlaceholder({ className, size = 28 }: IconProps) {
  return (
    <div className={cn('flex h-full items-center justify-center', className)}>
      <RaccoonIcon
        size={size}
        className="opacity-50 transition-opacity duration-300 group-hover:opacity-80"
      />
    </div>
  );
}
