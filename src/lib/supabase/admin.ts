import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé "service_role".
 * ⚠️ À utiliser UNIQUEMENT côté serveur (Server Actions / Route Handlers),
 * jamais dans le navigateur. Cette clé contourne les politiques RLS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Clé service_role manquante. Renseignez SUPABASE_SERVICE_ROLE_KEY dans .env.local (uniquement côté serveur).",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
