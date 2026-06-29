"use client";

import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { idadeEmAnos, formatarData } from "@/lib/format";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { cn } from "@/lib/utils";
import type { Contato, KanbanColuna, UltimosCliquesMap } from "@/lib/database.types";

export default function ContatoKanban({
  contatos,
  colunas,
  ministerioId,
  ultimosCliques,
  setContatos,
}: {
  contatos: Contato[];
  colunas: KanbanColuna[];
  ministerioId: string;
  ultimosCliques: UltimosCliquesMap;
  setContatos: React.Dispatch<React.SetStateAction<Contato[]>>;
}) {
  const supabase = createClient();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
  );

  async function handleDragEnd(e: DragEndEvent) {
    const contatoId = e.active.id as string;
    const colunaDestino = e.over?.id as string | undefined;
    if (!colunaDestino) return;
    const contato = contatos.find((c) => c.id === contatoId);
    if (!contato || contato.coluna_id === colunaDestino) return;

    const anterior = contatos;
    setContatos((cs) =>
      cs.map((c) =>
        c.id === contatoId ? { ...c, coluna_id: colunaDestino } : c,
      ),
    );

    const { error } = await supabase
      .from("contatos")
      .update({ coluna_id: colunaDestino })
      .eq("id", contatoId);

    if (error) {
      setContatos(anterior);
      toast.error(error.message);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {colunas.map((coluna) => (
          <Coluna
            key={coluna.id}
            coluna={coluna}
            contatos={contatos.filter((c) => c.coluna_id === coluna.id)}
            ministerioId={ministerioId}
            ultimosCliques={ultimosCliques}
          />
        ))}
        {colunas.length === 0 && (
          <p className="text-muted-foreground p-4">
            Nenhuma coluna configurada.
          </p>
        )}
      </div>
    </DndContext>
  );
}

function Coluna({
  coluna,
  contatos,
  ministerioId,
  ultimosCliques,
}: {
  coluna: KanbanColuna;
  contatos: Contato[];
  ministerioId: string;
  ultimosCliques: UltimosCliquesMap;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id });

  return (
    <div className="flex-shrink-0 w-72 rounded-xl border bg-muted/40 p-3">
      <div className="font-semibold text-sm uppercase tracking-wide mb-3 flex items-center justify-between">
        <span>{coluna.nome}</span>
        <Badge variant="secondary">{contatos.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-2 min-h-[200px] rounded-lg border-2 border-dashed p-1 transition-colors",
          isOver ? "border-primary bg-primary/5" : "border-transparent",
        )}
      >
        {contatos.map((c) => (
          <ContatoCard
            key={c.id}
            contato={c}
            ministerioId={ministerioId}
            ultimoClique={ultimosCliques[c.id]}
          />
        ))}
      </div>
    </div>
  );
}

function formatarUltimoClique(clicado_em: string, perfil_nome: string): string {
  const d = new Date(clicado_em);
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const primeiroNome = perfil_nome.split(" ")[0];
  return `${dia} às ${hora} · ${primeiroNome}`;
}

function ContatoCard({
  contato,
  ministerioId,
  ultimoClique,
}: {
  contato: Contato;
  ministerioId: string;
  ultimoClique?: { clicado_em: string; perfil_nome: string };
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: contato.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-50",
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">{contato.nome_completo}</p>
          <WhatsAppButton
            celular={contato.celular}
            contatoId={contato.id}
            ministerioId={ministerioId}
            className="size-7 shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {idadeEmAnos(contato.data_nascimento)} anos · Cadastro: {formatarData(contato.criado_em)}
        </div>
        {ultimoClique && (
          <div className="text-xs text-muted-foreground/70 border-t pt-1.5">
            Último WhatsApp: {formatarUltimoClique(ultimoClique.clicado_em, ultimoClique.perfil_nome)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
