import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cardocia — Gestion de collection Pokémon",
    template: "%s · Cardocia",
  },
  description:
    "Gérez votre collection de cartes Pokémon, vos achats, ventes, stocks, lots et boosters reconditionnés.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
