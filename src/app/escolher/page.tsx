import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard } from "lucide-react";
import { requireSession } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

const ministerioImagem: Record<string, string> = {
  npdp: "/ministerios/npdp.jpg",
  "role-up": "/ministerios/role-up.jpg",
  "we-go": "/ministerios/we-go.jpg",
};

export default async function EscolherPage() {
  const session = await requireSession();

  if (session.ministerios.length === 0) redirect("/sem-ministerio");
  if (!session.isMaster && session.ministerios.length === 1)
    redirect(`/${session.ministerios[0].slug}/pessoas`);

  const primeiroNome = session.profile.nome_completo.split(" ")[0];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground text-[11px] font-bold">
              ng
            </div>
            <span className="text-sm font-bold">Nasci pra Deus</span>
          </div>
          <h1 className="text-2xl font-semibold">Olá, {primeiroNome}</h1>
          <p className="text-sm text-muted-foreground">
            Selecione o ministério que deseja acessar.
          </p>
        </div>

        <div className="flex flex-row gap-3">
          {session.isMaster && (
            <Link
              href="/admin/usuarios"
              className="group flex flex-col overflow-hidden rounded-xl border bg-card hover:border-primary transition-colors w-36 shrink-0"
            >
              <div className="aspect-square bg-primary/10 flex flex-col items-center justify-center gap-2 group-hover:bg-primary/15 transition-colors">
                <LayoutDashboard className="size-7 text-primary" />
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wide text-center leading-tight px-2">
                  Gestão
                </span>
              </div>
              <div className="px-2 py-2 border-t">
                <p className="text-xs font-medium truncate">Painel Gerencial</p>
              </div>
            </Link>
          )}

          {session.ministerios.map((ministerio) => {
            const imagem = ministerioImagem[ministerio.slug];
            return (
              <Link
                key={ministerio.id}
                href={`/${ministerio.slug}/pessoas`}
                className="group flex flex-col overflow-hidden rounded-xl border bg-card hover:border-primary transition-colors w-36 shrink-0"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {imagem ? (
                    <Image
                      src={imagem}
                      alt={ministerio.nome}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {ministerio.nome[0]}
                    </div>
                  )}
                </div>
                <div className="px-2 py-2 border-t">
                  <p className="text-xs font-medium truncate">{ministerio.nome}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
