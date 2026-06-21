import { requireMinisterio } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ControleClient from "./controle-client";

export default async function ControlePage({
  params,
}: {
  params: Promise<{ ministerio: string }>;
}) {
  const { ministerio: slug } = await params;
  const { ministerio } = await requireMinisterio(slug);

  const supabase = await createClient();
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

  if (!estado) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Estado do cronômetro não encontrado.
      </div>
    );
  }

  return (
    <ControleClient
      ministerio={ministerio}
      estadoInicial={estado}
      imagensIniciais={imagens ?? []}
    />
  );
}
