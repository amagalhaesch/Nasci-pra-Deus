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
import {
  idadeEmAnos,
  formatarCelular,
  formatarData,
  whatsAppLink,
} from "@/lib/format";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contato, KanbanColuna } from "@/lib/database.types";

export default function ContatoKanban({
  contatos,
  colunas,
  ministerioId,
  setContatos,
}: {
  contatos: Contato[];
  colunas: KanbanColuna[];
  ministerioId: string;
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

  void ministerioId; // assinatura mantida pra futura granularidade

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {colunas.map((coluna) => (
          <Coluna
            key={coluna.id}
            coluna={coluna}
            contatos={contatos.filter((c) => c.coluna_id === coluna.id)}
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
}: {
  coluna: KanbanColuna;
  contatos: Contato[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id });

  return (
    <div className="flex-shrink-0 w-72">
      <div className="font-semibold text-sm uppercase tracking-wide mb-2 flex items-center justify-between">
        <span>{coluna.nome}</span>
        <Badge variant="secondary">{contatos.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-2 min-h-[200px] rounded-lg border-2 border-dashed p-2 transition-colors",
          isOver ? "border-primary bg-primary/5" : "border-transparent",
        )}
      >
        {contatos.map((c) => (
          <ContatoCard key={c.id} contato={c} />
        ))}
      </div>
    </div>
  );
}

function ContatoCard({ contato }: { contato: Contato }) {
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
      <CardContent className="p-3 space-y-1.5">
        <div className="font-medium text-sm">{contato.nome_completo}</div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{idadeEmAnos(contato.data_nascimento)} anos</span>
          <a
            href={whatsAppLink(contato.celular)}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            className="text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            <MessageCircle className="size-3" />
            {formatarCelular(contato.celular)}
          </a>
        </div>
        <div className="text-xs text-muted-foreground/70">
          Cadastro: {formatarData(contato.criado_em)}
        </div>
      </CardContent>
    </Card>
  );
}
