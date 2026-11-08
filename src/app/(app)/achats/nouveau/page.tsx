import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { PageHeader } from "@/components/ui/StatCard";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";

export default async function NewPurchasePage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvel achat"
        description="Enregistrez un achat avec plusieurs lignes. Les frais sont calculés automatiquement."
        actions={
          <Link href="/achats" className="text-sm text-muted transition-colors hover:text-ink">
            ← Retour aux achats
          </Link>
        }
      />
      <PurchaseForm />
    </div>
  );
}
