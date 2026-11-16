import { requireUser } from "@/lib/get-user";
import { PageHeader, SpaceBanner } from "@/components/ui/StatCard";
import { ImportAssistant } from "@/components/import/ImportAssistant";

export default async function ImportPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <SpaceBanner label="Imports" accent="#3b82f6" />
      <PageHeader
        title="Import CSV"
        description="Importez vos achats, ventes ou votre inventaire depuis un fichier CSV (Cardmarket, eBay…)."
      />
      <ImportAssistant />
    </div>
  );
}