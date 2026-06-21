import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await requireSession();
  if (session.isMaster) redirect("/admin/usuarios");
  if (session.ministerios.length === 0) redirect("/sem-ministerio");
  redirect(`/${session.ministerios[0].slug}/pessoas`);
}
