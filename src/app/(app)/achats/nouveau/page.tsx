import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { PageHeader } from "@/components/ui/StatCard";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";
import { ArrowLeft } from "lucide-react";

export default async function NewPurchasePage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvel achat"
        description="Enregistrez un achat avec plusieurs lignes. Les frais sont calculés automatiquement."
        actions={
          <Link href="/achats" className="text-sm text-muted transition-colors hover:text-ink">
            <ArrowLeft className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />Retour aux achats
          </Link>
        }
      />
      <PurchaseForm />
    </div>
  );
}
