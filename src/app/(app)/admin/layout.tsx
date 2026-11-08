import { requireAdmin } from "@/lib/get-user";

// L'espace d'administration est réservé aux comptes `is_admin`.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
