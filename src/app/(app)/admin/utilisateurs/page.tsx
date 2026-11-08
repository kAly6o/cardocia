import { requireAdmin } from "@/lib/get-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Button";
import { Table, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { setUserAdmin, banUser } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
  collection_items: { id: string }[];
  stock_items: { id: string }[];
}

export default async function AdminUsersPage() {
  const current = await requireAdmin();
  const supabase = createAdminClient();

  const [{ data: usersData }, authRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, full_name, is_admin, created_at, collection_items(id), stock_items(id)",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.auth.admin.listUsers({ perPage: 200 }),
  ]);

  const users = (usersData ?? []) as unknown as UserRow[];
  const bannedById = new Map<string, string | null>(
    (authRes.data?.users ?? []).map((u) => [u.id, u.banned_until ?? null]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Supervision des comptes : rôle administrateur et bannissement."
      />

      {users.length === 0 ? (
        <EmptyState title="Aucun utilisateur" description="Les comptes apparaîtront ici." />
      ) : (
        <Table
          headers={["Utilisateur", "Rôle", "Statut", "Inscrit le", "Collection", "Stock", "Actions"]}
        >
          {users.map((u) => {
            const isSelf = u.id === current.id;
            const banned = bannedById.get(u.id) ?? null;
            return (
              <tr key={u.id} className="hover:bg-surface-2/40">
                <Td>
                  <p className="font-medium text-ink">{u.full_name || "Utilisateur"}</p>
                  <p className="text-xs text-muted">{u.email ?? "—"}</p>
                </Td>
                <Td>
                  {u.is_admin ? (
                    <Badge className="border-amber-600/40 bg-amber-900/30 text-amber-300">
                      Admin
                    </Badge>
                  ) : (
                    <Badge>Membre</Badge>
                  )}
                </Td>
                <Td>
                  {banned ? (
                    <Badge className="border-red-600/40 bg-red-900/30 text-red-300">Banni</Badge>
                  ) : (
                    <Badge className="border-emerald-600/40 bg-emerald-900/30 text-emerald-300">
                      Actif
                    </Badge>
                  )}
                </Td>
                <Td className="text-muted">{formatDate(u.created_at)}</Td>
                <Td className="tabular-nums text-muted">{u.collection_items?.length ?? 0}</Td>
                <Td className="tabular-nums text-muted">{u.stock_items?.length ?? 0}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!isSelf && (
                      <ConfirmForm
                        action={setUserAdmin}
                        message={
                          u.is_admin
                            ? "Retirer le rôle administrateur à cet utilisateur ?"
                            : "Promouvoir cet utilisateur comme administrateur ?"
                        }
                      >
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="admin" value={u.is_admin ? "false" : "true"} />
                        <button
                          type="submit"
                          className="h-7 rounded-lg border border-line px-2 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                        >
                          {u.is_admin ? "Rétrograder" : "Promouvoir"}
                        </button>
                      </ConfirmForm>
                    )}
                    {!isSelf && (
                      <ConfirmForm
                        action={banUser}
                        message={banned ? "Débannir cet utilisateur ?" : "Bannir cet utilisateur ?"}
                      >
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="ban" value={banned ? "false" : "true"} />
                        <button
                          type="submit"
                          className={
                            banned
                              ? "h-7 rounded-lg border border-emerald-600/40 px-2 text-xs text-emerald-300 transition-colors hover:bg-emerald-900/20"
                              : "h-7 rounded-lg border border-red-600/40 px-2 text-xs text-red-300 transition-colors hover:bg-red-900/20"
                          }
                        >
                          {banned ? "Débannir" : "Bannir"}
                        </button>
                      </ConfirmForm>
                    )}
                    {isSelf && <span className="text-xs text-faint">(vous)</span>}
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
