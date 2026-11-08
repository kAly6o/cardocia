"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CardImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-surface-2 to-surface-3 text-faint",
          className,
        )}
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8 opacity-40" fill="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 2a10 10 0 0 1 10 10H12V2z" fill="#ef4444" />
          <rect x="11" y="7" width="2" height="10" />
          <rect x="7" y="11" width="10" height="2" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- images distantes (TCGdex), next/image non configuré
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className={cn("object-cover", className)}
    />
  );
}
