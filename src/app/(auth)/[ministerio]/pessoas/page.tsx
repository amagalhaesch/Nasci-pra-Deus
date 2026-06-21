import { requireMinisterio } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PessoasClient from "./pessoas-client";

export default async function PessoasPage({
  params,
}: {
  params: Promise<{ ministerio: string }>;
}) {
  const { ministerio: slug } = await params;
  const { session, ministerio } = await requireMinisterio(slug);
  const supabase = await createClient();

  const [{ data: contatos }, { data: colunas }] = await Promise.all([
    supabase
      .from("contatos")
      .select("*")
      .eq("ministerio_id", ministerio.id)
      .order("criado_em", { ascending: false }),
    supabase.from("kanban_colunas").select("*").order("ordem"),
  ]);

  return (
    <PessoasClient
      ministerio={ministerio}
      contatosIniciais={contatos ?? []}
      colunasIniciais={colunas ?? []}
      isMaster={session.isMaster}
    />
  );
}
