import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CadastroForm from "./cadastro-form";

export default async function CadastroPage({
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

  return (
    <CadastroForm
      ministerioId={ministerio.id}
      ministerioNome={ministerio.nome}
    />
  );
}
