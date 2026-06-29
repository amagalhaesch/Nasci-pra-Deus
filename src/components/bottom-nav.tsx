"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Timer, Shield, Cake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ministerio } from "@/lib/database.types";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

export default function BottomNav({
  ministerio,
  isMaster,
}: {
  ministerio: Ministerio;
  isMaster: boolean;
}) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "Pessoas", href: `/${ministerio.slug}/pessoas`, icon: Users },
    { label: "Aniversário", href: `/${ministerio.slug}/aniversariantes`, icon: Cake },
    { label: "Cronômetro", href: `/${ministerio.slug}/cronometro/controle`, icon: Timer },
  ];

  if (isMaster) {
    navItems.push({ label: "Gestão", href: "/admin/usuarios", icon: Shield });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card md:hidden">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
