import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Ministerio, Profile } from "@/lib/database.types";

export type SessionContext = {
  userId: string;
  profile: Profile;
  ministerios: Ministerio[];
  isMaster: boolean;
};

export async function getSession(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const isMaster = profile.role === "master";

  let ministerios: Ministerio[] = [];
  if (isMaster) {
    const { data } = await supabase
      .from("ministerios")
      .select("*")
      .order("nome");
    ministerios = data ?? [];
  } else {
    const { data } = await supabase
      .from("ministerio_membros")
      .select("ministerios(*)")
      .eq("profile_id", user.id);
    ministerios = (data ?? [])
      .map((row) => row.ministerios as unknown as Ministerio)
      .filter(Boolean);
  }

  return { userId: user.id, profile, ministerios, isMaster };
}

export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireMaster(): Promise<SessionContext> {
  const session = await requireSession();
  if (!session.isMaster) redirect("/");
  return session;
}

export async function requireMinisterio(slug: string) {
  const session = await requireSession();
  const ministerio = session.ministerios.find((m) => m.slug === slug);
  if (!ministerio) redirect("/");
  return { session, ministerio };
}

export async function getMinisterioBySlug(slug: string): Promise<Ministerio | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ministerios")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}
