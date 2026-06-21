import Link from "next/link";
import { requireSession } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                ng
              </div>
              <span className="text-sm font-bold">Nasci pra Deus</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            {session.ministerios.map((m) => (
              <Link
                key={m.id}
                href={`/${m.slug}/pessoas`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {m.nome}
              </Link>
            ))}
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
