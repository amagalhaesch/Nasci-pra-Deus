import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await requireSession();
  if (session.ministerios.length === 0) redirect("/sem-ministerio");
  if (session.ministerios.length > 1) redirect("/escolher");
  redirect(`/${session.ministerios[0].slug}/pessoas`);
}
