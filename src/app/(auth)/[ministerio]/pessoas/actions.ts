"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function ensureMaster() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "master") throw new Error("Apenas master");
}

const editContatoSchema = z.object({
  id: z.string().uuid(),
  nome_completo: z.string().min(2),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  celular: z.string().min(8),
});

export async function editarContato(input: z.infer<typeof editContatoSchema>) {
  await ensureMaster();
  const parsed = editContatoSchema.parse(input);
  const admin = createAdminClient();
  const { error } = await admin
    .from("contatos")
    .update({
      nome_completo: parsed.nome_completo,
      data_nascimento: parsed.data_nascimento,
      celular: parsed.celular,
    })
    .eq("id", parsed.id);
  if (error) throw new Error(error.message);
}

export async function excluirContato(id: string) {
  await ensureMaster();
  const admin = createAdminClient();
  const { error } = await admin.from("contatos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

const colunaSchema = z.object({
  nome: z.string().min(1).max(40),
});

export async function criarColuna(input: z.infer<typeof colunaSchema>) {
  await ensureMaster();
  const { nome } = colunaSchema.parse(input);
  const admin = createAdminClient();
  const { data: ultima } = await admin
    .from("kanban_colunas")
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();
  const proxOrdem = (ultima?.ordem ?? -1) + 1;
  const { error } = await admin
    .from("kanban_colunas")
    .insert({ nome, ordem: proxOrdem });
  if (error) throw new Error(error.message);
}

export async function renomearColuna(id: string, nome: string) {
  await ensureMaster();
  const admin = createAdminClient();
  const { error } = await admin
    .from("kanban_colunas")
    .update({ nome })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function excluirColuna(id: string) {
  await ensureMaster();
  const admin = createAdminClient();
  // verificar que não há contatos
  const { count } = await admin
    .from("contatos")
    .select("id", { count: "exact", head: true })
    .eq("coluna_id", id);
  if ((count ?? 0) > 0) {
    throw new Error(
      `Coluna possui ${count} contato(s). Mova-os antes de excluir.`,
    );
  }
  const { error } = await admin
    .from("kanban_colunas")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function reordenarColuna(id: string, direcao: -1 | 1) {
  await ensureMaster();
  const admin = createAdminClient();
  const { data: colunas } = await admin
    .from("kanban_colunas")
    .select("id, ordem")
    .order("ordem");
  if (!colunas) return;
  const idx = colunas.findIndex((c) => c.id === id);
  const vizinhoIdx = idx + direcao;
  if (idx < 0 || vizinhoIdx < 0 || vizinhoIdx >= colunas.length) return;
  const alvo = colunas[idx];
  const vizinho = colunas[vizinhoIdx];
  await Promise.all([
    admin
      .from("kanban_colunas")
      .update({ ordem: vizinho.ordem })
      .eq("id", alvo.id),
    admin
      .from("kanban_colunas")
      .update({ ordem: alvo.ordem })
      .eq("id", vizinho.id),
  ]);
  revalidatePath("/");
}
