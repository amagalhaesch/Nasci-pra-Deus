"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  ministerio_id: z.string().uuid(),
  nome_completo: z.string().min(2).max(120),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  celular: z.string().min(8).max(30),
});

export async function cadastrarContato(input: z.infer<typeof schema>) {
  const parsed = schema.parse(input);
  const admin = createAdminClient();

  const { data: coluna, error: colErr } = await admin
    .from("kanban_colunas")
    .select("id")
    .order("ordem", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (colErr || !coluna) {
    throw new Error("Nenhuma coluna configurada no kanban.");
  }

  const { error } = await admin.from("contatos").insert({
    ministerio_id: parsed.ministerio_id,
    nome_completo: parsed.nome_completo,
    data_nascimento: parsed.data_nascimento,
    celular: parsed.celular,
    coluna_id: coluna.id,
  });
  if (error) throw new Error(error.message);
}
