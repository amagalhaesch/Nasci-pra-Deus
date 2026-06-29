import { requireMinisterio } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PessoasClient from "./pessoas-client";
import type { UltimosCliquesMap } from "@/lib/database.types";

export default async function PessoasPage({
  params,
}: {
  params: Promise<{ ministerio: string }>;
}) {
  const { ministerio: slug } = await params;
  const { session, ministerio } = await requireMinisterio(slug);
  const supabase = await createClient();

  const [{ data: contatos }, { data: colunas }, { data: cliquesData }] =
    await Promise.all([
      supabase
        .from("contatos")
        .select("*")
        .eq("ministerio_id", ministerio.id)
        .order("criado_em", { ascending: false }),
      supabase.from("kanban_colunas").select("*").order("ordem"),
      supabase
        .from("whatsapp_cliques")
        .select("contato_id, clicado_em, profiles(nome_completo)")
        .eq("ministerio_id", ministerio.id)
        .order("clicado_em", { ascending: false }),
    ]);

  const ultimosCliques: UltimosCliquesMap = {};
  for (const c of cliquesData ?? []) {
    if (!ultimosCliques[c.contato_id]) {
      ultimosCliques[c.contato_id] = {
        clicado_em: c.clicado_em,
        perfil_nome:
          (c.profiles as { nome_completo: string } | null)?.nome_completo ?? "—",
      };
    }
  }

  return (
    <PessoasClient
      ministerio={ministerio}
      contatosIniciais={contatos ?? []}
      colunasIniciais={colunas ?? []}
      isMaster={session.isMaster}
      ultimosCliquesIniciais={ultimosCliques}
    />
  );
}
