import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  section?: string;
}

function Icon({ d }: { d: string }) {
  return (
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
      <path d={d} />
    </svg>
  );
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Tableau de bord",
    icon: (
      <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
    ),
  },
  {
    href: "/collection",
    label: "Ma collection",
    section: "Collection",
    icon: (
      <Icon d="M3 7l9-4 9 4v10l-9 4-9-4V7zM12 3v18" />
    ),
  },
  {
    href: "/stock",
    label: "Stock à vendre",
    section: "Commerce",
    icon: (
      <Icon d="M20 12V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6M16 22l5-5M21 17l-5 5" />
    ),
  },
  {
    href: "/achats",
    label: "Achats",
    section: "Commerce",
    icon: (
      <Icon d="M3 3h2l2.4 12.2a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 6H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    ),
  },
  {
    href: "/ventes",
    label: "Ventes",
    section: "Commerce",
    icon: (
      <Icon d="M2 6h20M4 6l1.5 12a2 2 0 0 0 2 1.8h9a2 2 0 0 0 2-1.8L20 6M12 9v6M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2" />
    ),
  },
  {
    href: "/lots",
    label: "Lots & Boosters",
    section: "Commerce",
    icon: (
      <Icon d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7l2-3h14l2 3" />
    ),
  },
  {
    href: "/historique",
    label: "Historique",
    section: "Analyse",
    icon: (
      <Icon d="M12 8v4l3 3M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
    ),
  },
  {
    href: "/statistiques",
    label: "Statistiques",
    section: "Analyse",
    icon: (
      <Icon d="M3 3v18h18M8 17V9M13 17V5M18 17v-7" />
    ),
  },
  {
    href: "/parametres",
    label: "Paramètres",
    section: "Réglages",
    icon: (
      <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    ),
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Accueil",
    icon: (
      <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
    ),
    section: "Accueil",
  },
  {
    href: "/collection",
    label: "Collection",
    icon: (
      <Icon d="M3 7l9-4 9 4v10l-9 4-9-4V7zM12 3v18" />
    ),
    section: "Collection",
  },
  {
    href: "/stock",
    label: "Stock",
    icon: (
      <Icon d="M20 12V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6M16 22l5-5M21 17l-5 5" />
    ),
    section: "Commerce",
  },
  {
    href: "/scan",
    label: "Scanner",
    icon: (
      <Icon d="M13 2H3v6h10M5 13h14M5 17h14v6h-7v-6H5v-6h8v-2a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v2H3v-6c0-2 1.5-3.5 3-3s3 .5 3 3v6h2v-6a2 2 0 0 1 2-2h6v6a2 2 0 0 1-2 2H5v-6zm-2 2h2v6H3v-6zm4-5h2v2h2v-2h2v-2h2V7h2v6h-2V5h-2v2zm2 8H5v-2h2v2zm0-3H5v-2h2v2zm3-3v2h2v-2H8v-2zm3 8v-2h6v2h-6zm5-8h2v6h-2V5z" />
    ),
    section: "Outils",
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Administration",
    icon: (
      <Icon d="M12 3l7 3v5c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6zM9 12l2 2 4-4" />
    ),
  },
  {
    href: "/admin/catalogue",
    label: "Catalogue",
    icon: (
      <Icon d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />
    ),
  },
  {
    href: "/admin/utilisateurs",
    label: "Utilisateurs",
    icon: (
      <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    ),
  },
  {
    href: "/admin/tcgdex",
    label: "Import TCGdex",
    icon: (
      <Icon d="M12 3v12M7 10l5 5 5-5M4 21h16" />
    ),
  },
];
