"use client";

import { useState } from "react";

export function LogoImage({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string | null;
  alt: string;
  fallback?: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-muted">
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