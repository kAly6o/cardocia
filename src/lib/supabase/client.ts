import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase à utiliser uniquement dans le navigateur
 * (Client Components et Server Actions appelées côté client).
 * La clé anon est publique et ne donne pas accès aux données
 * sans passer par les politiques RLS.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Configuration Supabase manquante. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.",
    );
  }

  return createBrowserClient(url, anonKey);
}
