"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Users, Timer, Shield, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Ministerio, Profile } from "@/lib/database.types";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

function NavLink({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

export default function MinisterioSidebar({
  ministerio,
  profile,
  isMaster,
}: {
  ministerio: Ministerio;
  profile: Profile;
  isMaster: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navItems: NavItem[] = [
    { label: "Pessoas", href: `/${ministerio.slug}/pessoas`, icon: Users },
    { label: "Cronômetro", href: `/${ministerio.slug}/cronometro/controle`, icon: Timer },
  ];

  if (isMaster) {
    navItems.push({ label: "Usuários", href: "/admin/usuarios", icon: Shield });
  }

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    });
  }

  const initials = profile.nome_completo
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex size-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
          ng
        </div>
        <span className="text-sm font-bold">Nasci pra Deus</span>
      </div>

      {/* Ministério */}
      <div className="border-b px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Ministério
        </p>
        <p className="mt-0.5 truncate text-sm font-medium">{ministerio.nome}</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Usuário */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">
              {profile.nome_completo}
            </p>
            <p className="text-xs text-muted-foreground">
              {isMaster ? "Master" : "Líder"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isPending}
            title="Sair"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
