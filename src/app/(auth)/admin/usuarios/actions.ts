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

const criarSchema = z.object({
  nome_completo: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  role: z.enum(["lider", "master"]),
  ministerio_ids: z.array(z.string().uuid()),
});

export async function criarUsuario(input: z.infer<typeof criarSchema>) {
  await ensureMaster();
  const { nome_completo, email, senha, role, ministerio_ids } = criarSchema.parse(input);

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome_completo, role },
  });
  if (error) throw new Error(error.message);

  // Trigger handle_new_user já cria o profile com role. Mas garante role correta.
  await admin
    .from("profiles")
    .update({ nome_completo, role })
    .eq("id", created.user.id);

  if (ministerio_ids.length > 0) {
    await admin.from("ministerio_membros").insert(
      ministerio_ids.map((mid) => ({
        profile_id: created.user.id,
        ministerio_id: mid,
      })),
    );
  }

  revalidatePath("/admin/usuarios");
}

const atualizarSchema = z.object({
  user_id: z.string().uuid(),
  nome_completo: z.string().min(2),
  role: z.enum(["lider", "master"]),
  ministerio_ids: z.array(z.string().uuid()),
});

export async function atualizarUsuario(input: z.infer<typeof atualizarSchema>) {
  await ensureMaster();
  const { user_id, nome_completo, role, ministerio_ids } = atualizarSchema.parse(input);

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ nome_completo, role })
    .eq("id", user_id);

  await admin.from("ministerio_membros").delete().eq("profile_id", user_id);
  if (ministerio_ids.length > 0) {
    await admin.from("ministerio_membros").insert(
      ministerio_ids.map((mid) => ({
        profile_id: user_id,
        ministerio_id: mid,
      })),
    );
  }

  revalidatePath("/admin/usuarios");
}

export async function excluirUsuario(user_id: string) {
  await ensureMaster();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user_id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
}
