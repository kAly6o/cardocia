"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function LogoImage({
  src,
  alt,
  fallback,
  className,
  fallbackClassName,
}: {
  src?: string | null;
  alt: string;
  fallback?: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-accent to-brand font-bold text-white",
          fallbackClassName ?? "h-14 w-14 text-xl",
        )}
      >
        {fallback ?? "?"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- logos distants (TCGdex)
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className={className ?? "h-full w-full object-contain"}
    />
  );
}