"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus, Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  criarColuna,
  renomearColuna,
  excluirColuna,
  reordenarColuna,
} from "./actions";
import type { KanbanColuna } from "@/lib/database.types";

export default function ColunasDialog({
  open,
  onOpenChange,
  colunas,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  colunas: KanbanColuna[];
}) {
  const [novoNome, setNovoNome] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [pending, startTransition] = useTransition();

  function chamada(promise: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await promise();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    chamada(async () => {
      await criarColuna({ nome: novoNome.trim() });
      setNovoNome("");
      toast.success("Coluna criada");
    });
  }

  function iniciarEdit(c: KanbanColuna) {
    setEditingId(c.id);
    setEditingNome(c.nome);
  }

  function salvarEdit() {
    if (!editingId || !editingNome.trim()) return;
    const id = editingId;
    const nome = editingNome.trim();
    chamada(async () => {
      await renomearColuna(id, nome);
      setEditingId(null);
      toast.success("Renomeada");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Colunas do Kanban</DialogTitle>
          <DialogDescription>
            Colunas são globais — compartilhadas entre todos os ministérios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCriar} className="flex gap-2">
          <Input
            placeholder="Nome da nova coluna..."
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
          />
          <Button type="submit" disabled={pending || !novoNome.trim()}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </form>

        <div className="space-y-2">
          {colunas.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              {editingId === c.id ? (
                <>
                  <Input
                    value={editingNome}
                    onChange={(e) => setEditingNome(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && salvarEdit()}
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={salvarEdit}
                    disabled={pending}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{c.nome}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === 0 || pending}
                    onClick={() =>
                      chamada(() => reordenarColuna(c.id, -1))
                    }
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === colunas.length - 1 || pending}
                    onClick={() => chamada(() => reordenarColuna(c.id, 1))}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => iniciarEdit(c)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`Excluir coluna "${c.nome}"?`)) return;
                      chamada(async () => {
                        await excluirColuna(c.id);
                        toast.success("Coluna excluída");
                      });
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
