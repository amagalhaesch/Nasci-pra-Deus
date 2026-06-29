import { requireMinisterio } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AniversariantesClient from "./aniversariantes-client";

export default async function AniversariantesPage({
  params,
}: {
  params: Promise<{ ministerio: string }>;
}) {
  const { ministerio: slug } = await params;
  const { ministerio } = await requireMinisterio(slug);
  const supabase = await createClient();

  const { data: contatos } = await supabase
    .from("contatos")
    .select("id, nome_completo, data_nascimento, celular")
    .eq("ministerio_id", ministerio.id);

  return (
    <AniversariantesClient
      ministerio={ministerio}
      contatos={contatos ?? []}
    />
  );
}
