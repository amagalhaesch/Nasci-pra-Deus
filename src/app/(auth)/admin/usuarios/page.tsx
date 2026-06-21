import { requireMaster } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import UsuariosClient from "./usuarios-client";

export default async function UsuariosPage() {
  await requireMaster();
  const supabase = await createClient();

  const [{ data: profiles }, { data: ministerios }, { data: membros }] = await Promise.all([
    supabase.from("profiles").select("*").order("criado_em", { ascending: false }),
    supabase.from("ministerios").select("*").order("nome"),
    supabase.from("ministerio_membros").select("*"),
  ]);

  const ministeriosPorUsuario = new Map<string, string[]>();
  for (const m of membros ?? []) {
    const arr = ministeriosPorUsuario.get(m.profile_id) ?? [];
    arr.push(m.ministerio_id);
    ministeriosPorUsuario.set(m.profile_id, arr);
  }

  const usuarios = (profiles ?? []).map((p) => ({
    ...p,
    ministerio_ids: ministeriosPorUsuario.get(p.id) ?? [],
  }));

  return (
    <UsuariosClient usuarios={usuarios} ministerios={ministerios ?? []} />
  );
}
