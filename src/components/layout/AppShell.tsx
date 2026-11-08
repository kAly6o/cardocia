"use client";

import { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, ADMIN_NAV_ITEMS, BOTTOM_NAV_ITEMS, type NavItem } from "./navigation";
import { Brand } from "@/components/Brand";
import { signOut } from "@/lib/actions/auth";
import { cn, initials } from "@/lib/utils";

function NavLinks({
  onNavigate,
  isAdmin,
}: {
  onNavigate?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  const renderItem = (item: NavItem) => {
    const active =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          active
            ? "bg-surface-2 font-medium text-ink"
            : "text-muted hover:bg-surface-2/60 hover:text-ink",
        )}
      >
        <span className={cn(active ? "text-fire" : "text-faint")}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item, i) => {
        const showHeader =
          item.section && (i === 0 || NAV_ITEMS[i - 1]?.section !== item.section);
        return (
          <Fragment key={item.href}>
            {showHeader && (
              <p className="mb-1 mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-faint">
                {item.section}
              </p>
            )}
            {renderItem(item)}
          </Fragment>
        );
      })}

      {isAdmin && (
        <>
          <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-faint">
            Administration
          </p>
          {ADMIN_NAV_ITEMS.map(renderItem)}
        </>
      )}
    </nav>
  );
}

function UserMenu({
  email,
  fullName,
}: {
  email: string | null;
  fullName: string | null;
}) {
  return (
    <div className="border-t border-line p-3">
      <div className="mb-2 flex items-center gap-3 px-1">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-ink">
          {initials(fullName || email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">
            {fullName || "Utilisateur"}
          </p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Se déconnecter
        </button>
      </form>
    </div>
  );
}

export function AppShell({
  children,
  email,
  fullName,
  isAdmin,
}: {
  children: React.ReactNode;
  email: string | null;
  fullName: string | null;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="min-h-full">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks isAdmin={isAdmin} />
        </div>
        <UserMenu email={email} fullName={fullName} />
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks onNavigate={() => setOpen(false)} isAdmin={isAdmin} />
            </div>
            <UserMenu email={email} fullName={fullName} />
          </aside>
        </div>
      )}

      {/* En-tête mobile */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Brand />
      </header>

      {/* Bottom nav - seulement sur mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-line px-3 py-3 backdrop-blur-md shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.1)]">
        <nav className="max-w-7xl mx-auto">
          <ul className="flex w-full justify-between items-center gap-1">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li
                  key={item.href}
                  className="flex-1 flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <button
                    onClick={() => {
                      router.push(item.href);
                      setOpen(false);
                    }}
                    className="flex flex-col items-center justify-center gap-1 h-full w-full"
                  >
                    <span>{item.icon}</span>
                    <span className={`text-xs font-medium ${active ? "text-primary" : "text-muted"}`}>
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      )}

      {/* Contenu */}
      <main className="lg:pl-64 pb-28 overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
