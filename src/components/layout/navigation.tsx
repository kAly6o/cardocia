import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Layers,
  Tags,
  ShoppingCart,
  Receipt,
  Package,
  History,
  BarChart3,
  Settings,
  ScanLine,
  ShieldCheck,
  BookOpen,
  Users,
  Download,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  section?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Tableau de bord",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/collection",
    label: "Ma collection",
    section: "Collection",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    href: "/stock",
    label: "Stock à vendre",
    section: "Commerce",
    icon: <Tags className="h-5 w-5" />,
  },
  {
    href: "/achats",
    label: "Achats",
    section: "Commerce",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    href: "/ventes",
    label: "Ventes",
    section: "Commerce",
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    href: "/lots",
    label: "Lots & Boosters",
    section: "Commerce",
    icon: <Package className="h-5 w-5" />,
  },
  {
    href: "/historique",
    label: "Historique",
    section: "Analyse",
    icon: <History className="h-5 w-5" />,
  },
  {
    href: "/statistiques",
    label: "Statistiques",
    section: "Analyse",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    href: "/parametres",
    label: "Paramètres",
    section: "Réglages",
    icon: <Settings className="h-5 w-5" />,
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Accueil",
    icon: <LayoutDashboard className="h-5 w-5" />,
    section: "Accueil",
  },
  {
    href: "/collection",
    label: "Collection",
    icon: <Layers className="h-5 w-5" />,
    section: "Collection",
  },
  {
    href: "/stock",
    label: "Stock",
    icon: <Tags className="h-5 w-5" />,
    section: "Commerce",
  },
  {
    href: "/scan",
    label: "Scanner",
    icon: <ScanLine className="h-5 w-5" />,
    section: "Outils",
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Administration",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    href: "/admin/catalogue",
    label: "Catalogue",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    href: "/admin/utilisateurs",
    label: "Utilisateurs",
    icon: <Users className="h-5 w-5" />,
  },
  {
    href: "/admin/tcgdex",
    label: "Import TCGdex",
    icon: <Download className="h-5 w-5" />,
  },
];