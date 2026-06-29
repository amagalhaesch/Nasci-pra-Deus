"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { WhatsAppButton } from "@/components/whatsapp-button";
import type { Contato, Ministerio } from "@/lib/database.types";

type ContatoAniversario = Pick<
  Contato,
  "id" | "nome_completo" | "data_nascimento" | "celular"
>;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function parseBirthday(dateStr: string): { month: number; day: number } {
  const [, m, d] = dateStr.split("-").map(Number);
  return { month: m - 1, day: d };
}

function getUpcomingBirthday(dateStr: string, today: Date): Date {
  const { month, day } = parseBirthday(dateStr);
  let bday = new Date(today.getFullYear(), month, day);
  if (bday < today) {
    bday = new Date(today.getFullYear() + 1, month, day);
  }
  return bday;
}

function formatBirthday(dateStr: string): string {
  const { month, day } = parseBirthday(dateStr);
  return `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}`;
}


function Avatar({ name }: { name: string }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {name[0]?.toUpperCase()}
    </div>
  );
}

function ContatoCard({
  contato,
  showTodayBadge,
  ministerioId,
}: {
  contato: ContatoAniversario;
  showTodayBadge: boolean;
  ministerioId: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-4 py-3",
        showTodayBadge && "border-primary animate-birthday-glow"
      )}
    >
      <Avatar name={contato.nome_completo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{contato.nome_completo}</p>
        <p className="text-xs text-muted-foreground">
          {formatBirthday(contato.data_nascimento)}
        </p>
      </div>
      {showTodayBadge && (
        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
          Hoje
        </span>
      )}
      <WhatsAppButton celular={contato.celular} contatoId={contato.id} ministerioId={ministerioId} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

export default function AniversariantesClient({
  ministerio,
  contatos,
}: {
  ministerio: Ministerio;
  contatos: ContatoAniversario[];
}) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const in7Days = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + 6);
    return d;
  }, [today]);

  const { next7, restOfMonth, monthFiltered } = useMemo(() => {
    if (selectedMonth !== null) {
      const monthFiltered = contatos
        .filter((c) => parseBirthday(c.data_nascimento).month === selectedMonth)
        .sort(
          (a, b) =>
            parseBirthday(a.data_nascimento).day -
            parseBirthday(b.data_nascimento).day
        );
      return { next7: [], restOfMonth: [], monthFiltered };
    }

    const next7: ContatoAniversario[] = [];
    const restOfMonth: ContatoAniversario[] = [];

    for (const c of contatos) {
      const upcoming = getUpcomingBirthday(c.data_nascimento, today);
      if (upcoming >= today && upcoming <= in7Days) {
        next7.push(c);
      } else if (parseBirthday(c.data_nascimento).month === today.getMonth()) {
        restOfMonth.push(c);
      }
    }

    next7.sort((a, b) => {
      const da = getUpcomingBirthday(a.data_nascimento, today);
      const db = getUpcomingBirthday(b.data_nascimento, today);
      return da.getTime() - db.getTime();
    });

    restOfMonth.sort(
      (a, b) =>
        parseBirthday(a.data_nascimento).day -
        parseBirthday(b.data_nascimento).day
    );

    return { next7, restOfMonth, monthFiltered: [] };
  }, [contatos, selectedMonth, today, in7Days]);

  function isToday(dateStr: string): boolean {
    const { month, day } = parseBirthday(dateStr);
    return month === today.getMonth() && day === today.getDate();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <h1 className="text-lg font-semibold">
          Aniversariantes · {ministerio.nome}
        </h1>
        <select
          value={selectedMonth ?? ""}
          onChange={(e) =>
            setSelectedMonth(
              e.target.value === "" ? null : Number(e.target.value)
            )
          }
          className="rounded-md border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">Padrão (7 dias + mês)</option>
          {MESES.map((mes, i) => (
            <option key={i} value={i}>
              {mes}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-xl space-y-8">
        {selectedMonth !== null ? (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {MESES[selectedMonth]}
            </h2>
            {monthFiltered.length === 0 ? (
              <EmptyState
                text={`Nenhum aniversariante em ${MESES[selectedMonth]}.`}
              />
            ) : (
              <div className="space-y-2">
                {monthFiltered.map((c) => (
                  <ContatoCard
                    key={c.id}
                    contato={c}
                    showTodayBadge={isToday(c.data_nascimento)}
                    ministerioId={ministerio.id}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Próximos 7 dias
              </h2>
              {next7.length === 0 ? (
                <EmptyState text="Nenhum aniversariante nos próximos 7 dias." />
              ) : (
                <div className="space-y-2">
                  {next7.map((c) => (
                    <ContatoCard
                      key={c.id}
                      contato={c}
                      showTodayBadge={isToday(c.data_nascimento)}
                      ministerioId={ministerio.id}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Restante do mês
              </h2>
              {restOfMonth.length === 0 ? (
                <EmptyState text="Nenhum outro aniversariante este mês." />
              ) : (
                <div className="space-y-2">
                  {restOfMonth.map((c) => (
                    <ContatoCard
                      key={c.id}
                      contato={c}
                      showTodayBadge={false}
                      ministerioId={ministerio.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
