"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { editarContato } from "./actions";
import { aplicarMascaraCelular } from "@/lib/format";
import type { Contato } from "@/lib/database.types";

export default function EditarContatoDialog({
  contato,
  onClose,
}: {
  contato: Contato | null;
  onClose: () => void;
}) {
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [celular, setCelular] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (contato) {
      setNome(contato.nome_completo);
      setData(contato.data_nascimento);
      setCelular(aplicarMascaraCelular(contato.celular));
    }
  }, [contato]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contato) return;
    if (celular.replace(/\D/g, "").length !== 11) {
      toast.error("Celular deve ter 11 dígitos");
      return;
    }
    startTransition(async () => {
      try {
        await editarContato({
          id: contato.id,
          nome_completo: nome,
          data_nascimento: data,
          celular: celular.replace(/\D/g, ""),
        });
        toast.success("Contato atualizado");
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Dialog open={!!contato} onOpenChange={(b) => !b && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar contato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ed-nome">Nome completo</Label>
            <Input
              id="ed-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ed-data">Data de nascimento</Label>
            <Input
              id="ed-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ed-celular">Celular</Label>
            <Input
              id="ed-celular"
              inputMode="tel"
              placeholder="(11) 99999-9999"
              value={celular}
              onChange={(e) => setCelular(aplicarMascaraCelular(e.target.value))}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
