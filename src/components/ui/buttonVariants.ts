import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Classes utilitaires des boutons. Module SANS "use client" afin de pouvoir être
 * utilisé aussi bien côté client que côté serveur (composants serveur).
 */
export function buttonVariants(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
): string {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-fire/40 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand text-white hover:bg-brand-strong",
    secondary: "bg-surface-2 text-ink border border-line hover:bg-surface-3",
    ghost: "text-muted hover:text-ink hover:bg-surface-2",
    danger: "bg-red-600/90 text-white hover:bg-red-600",
    outline: "border border-line text-ink hover:bg-surface-2",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return cn(base, variants[variant], sizes[size]);
}
