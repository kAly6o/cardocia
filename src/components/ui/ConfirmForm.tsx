"use client";

import type { FormEvent, ReactNode } from "react";

/**
 * Formulaire avec confirmation (window.confirm) avant soumission.
 * `action` est une Server Action passée depuis un composant serveur.
 */
export function ConfirmForm({
  action,
  message,
  children,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
}) {
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    if (!window.confirm(message)) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}
