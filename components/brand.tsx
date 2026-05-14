import { useId } from "react";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 420 420"
      role="img"
      aria-label="SpendWise"
      className={cn("h-12 w-12", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${gradientId}-stroke`} x1="72" y1="320" x2="346" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#18c18d" />
          <stop offset="0.55" stopColor="#3fd37a" />
          <stop offset="1" stopColor="#b8ec61" />
        </linearGradient>
      </defs>
      <path
        d="M93 311C62 277 44 232 46 185C49 92 122 37 214 37C281 37 341 68 373 117"
        stroke={`url(#${gradientId}-stroke)`}
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M336 304C304 349 252 376 193 376C156 376 121 366 91 348"
        stroke={`url(#${gradientId}-stroke)`}
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M253 112H172C138 112 111 139 111 173C111 207 138 234 172 234H208C242 234 269 261 269 295C269 329 242 356 208 356H130"
        stroke="white"
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M224 314L269 260L300 302L357 192"
        stroke="white"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M286 204H319V312L286 275V204Z" fill={`url(#${gradientId}-stroke)`} />
      <path d="M327 159H360V271L327 233V159Z" fill={`url(#${gradientId}-stroke)`} />
      <path d="M366 113H399V227L366 189V113Z" fill={`url(#${gradientId}-stroke)`} />
      <path
        d="M300 324L385 239L374 219L331 262L300 230V324Z"
        fill={`url(#${gradientId}-stroke)`}
      />
      <path d="M69 257H147" stroke={`url(#${gradientId}-stroke)`} strokeWidth="14" strokeLinecap="round" />
      <path d="M78 290H133" stroke={`url(#${gradientId}-stroke)`} strokeWidth="14" strokeLinecap="round" />
      <path d="M91 322H122" stroke={`url(#${gradientId}-stroke)`} strokeWidth="14" strokeLinecap="round" />
      <path d="M105 352H117" stroke={`url(#${gradientId}-stroke)`} strokeWidth="14" strokeLinecap="round" />
    </svg>
  );
}

type BrandLockupProps = {
  className?: string;
  align?: "left" | "center";
  compact?: boolean;
};

export function BrandLockup({
  className,
  align = "left",
  compact = false,
}: BrandLockupProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        align === "center" && "justify-center text-center",
        className
      )}
    >
      <BrandMark className={compact ? "h-11 w-11" : "h-14 w-14"} />
      <div className={cn("space-y-0.5", align === "center" && "text-left")}>
        <div className={cn("text-2xl font-semibold tracking-tight", compact && "text-xl")}>
          <span className="text-foreground dark:text-white">Spend</span>
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-lime-300 bg-clip-text text-transparent">
            Wise
          </span>
        </div>
        {!compact ? (
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Smart budgeting. Better living.
          </p>
        ) : null}
      </div>
    </div>
  );
}
