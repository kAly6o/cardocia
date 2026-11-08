"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import {
  buttonVariants,
  type ButtonVariant as Variant,
  type ButtonSize as Size,
} from "./buttonVariants";

export { buttonVariants };

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(buttonVariants(variant, size), className)} {...props}>
      {children}
    </button>
  );
}

/** Bouton de soumission qui affiche un état "en cours". */
export function SubmitButton({
  children,
  pendingText = "En cours…",
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants(variant, size), className)}
      {...props}
    >
      {pending ? (
        <>
          <Spinner className="h-4 w-4" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className ?? "h-5 w-5")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function IconButton({
  children,
  title,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { title?: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-14 text-center">
      {icon ? (
        <div className="mb-3 text-faint">{icon}</div>
      ) : (
        <div className="mb-3 h-10 w-10 rounded-full bg-surface-2" />
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
