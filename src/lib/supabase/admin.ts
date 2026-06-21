import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createAdminClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ausente — pegue no painel do Supabase e adicione no .env.local",
    );
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRole,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
