import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Button";
import { Table, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { MOVEMENT_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface Row {
  id: string;
  type: string;
  quantity: number;
  notes: string | null;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
  card: { name: string } | null;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const supabase = await createClient();

  let req = supabase
    .from("stock_movements")
    .select("*, card:catalog_cards(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);
  if (sp.type) req = req.eq("type", sp.type);

  const { data } = await req;
  const movements = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique"
        description="Tous les mouvements sont conservés. Les corrections et annulations produisent des mouvements tracés."
      />

      <form method="get" className="panel-pad flex gap-3">
        <div className="w-64">
          <label className="field-label">Type de mouvement</label>
          <select className="select" name="type" defaultValue={sp.type ?? ""}>
            <option value="">Tous</option>
            {MOVEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-strong">
            Filtrer
          </button>
        </div>
      </form>

      {movements.length === 0 ? (
        <EmptyState title="Aucun mouvement" description="Les opérations apparaîtront ici dès que vous agirez sur votre collection ou votre stock." />
      ) : (
        <Table headers={["Date", "Type", "Carte", "Qté", "Détail"]}>
          {movements.map((m) => (
            <tr key={m.id} className="hover:bg-surface-2/40">
              <Td className="whitespace-nowrap text-muted">
                {formatDate(m.created_at, { dateStyle: "medium", timeStyle: "short" })}
              </Td>
              <Td>
                <Badge>{m.type}</Badge>
              </Td>
              <Td className="font-medium text-ink">{m.card?.name ?? m.notes ?? "—"}</Td>
              <Td className="tabular-nums">{m.quantity}</Td>
              <Td className="text-muted">
                {m.previous_status && m.new_status
                  ? `${m.previous_status} → ${m.new_status}`
                  : m.notes ?? "—"}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
