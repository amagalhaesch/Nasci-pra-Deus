import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ApresentacaoClient from "./apresentacao-client";

export default async function ApresentacaoPage({
  params,
}: {
  params: Promise<{ ministerio: string }>;
}) {
  const { ministerio: slug } = await params;
  const supabase = await createClient();

  const { data: ministerio } = await supabase
    .from("ministerios")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!ministerio) notFound();

  const [{ data: estado }, { data: imagens }] = await Promise.all([
    supabase
      .from("cronometro_estado")
      .select("*")
      .eq("ministerio_id", ministerio.id)
      .single(),
    supabase
      .from("cronometro_imagens")
      .select("*")
      .eq("ministerio_id", ministerio.id)
      .order("ordem"),
  ]);

  if (!estado) notFound();

  return (
    <ApresentacaoClient
      ministerioId={ministerio.id}
      estadoInicial={estado}
      imagensIniciais={imagens ?? []}
    />
  );
}
