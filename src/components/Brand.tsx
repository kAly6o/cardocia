import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-bold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fire to-brand-strong text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="9" opacity="0.9" />
          <path d="M12 2a10 10 0 0 1 10 10H12V2z" fill="#fff" opacity="0.9" />
          <rect x="11" y="7" width="2" height="10" fill="#dc2626" />
          <rect x="7" y="11" width="10" height="2" fill="#dc2626" />
        </svg>
      </span>
      <span className="text-lg tracking-tight">Cardocia</span>
    </Link>
  );
}
