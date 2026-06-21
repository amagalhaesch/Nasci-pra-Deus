"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarUsuario, atualizarUsuario, excluirUsuario } from "./actions";
import type { Ministerio, Profile } from "@/lib/database.types";

type UsuarioComMinisterios = Profile & { ministerio_ids: string[] };

export default function UsuariosClient({
  usuarios,
  ministerios,
}: {
  usuarios: UsuarioComMinisterios[];
  ministerios: Ministerio[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioComMinisterios | null>(null);

  const ministerioNome = (id: string) =>
    ministerios.find((m) => m.id === id)?.nome ?? id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo usuário
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Ministérios</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nome_completo}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "master" ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.ministerio_ids.length === 0 && (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                      {u.ministerio_ids.map((id) => (
                        <Badge key={id} variant="outline">
                          {ministerioNome(id)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(u);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteButton id={u.id} nome={u.nome_completo} />
                  </TableCell>
                </TableRow>
              ))}
              {usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum usuário cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UsuarioDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        ministerios={ministerios}
      />
    </div>
  );
}

function DeleteButton({ id, nome }: { id: string; nome: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Excluir ${nome}? Esta ação é irreversível.`)) return;
        startTransition(async () => {
          try {
            await excluirUsuario(id);
            toast.success("Usuário excluído");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao excluir");
          }
        });
      }}
    >
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}

function UsuarioDialog({
  open,
  onOpenChange,
  editing,
  ministerios,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  editing: UsuarioComMinisterios | null;
  ministerios: Ministerio[];
}) {
  const [pending, startTransition] = useTransition();
  const [nome, setNome] = useState(editing?.nome_completo ?? "");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<"lider" | "master">(editing?.role ?? "lider");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(editing?.ministerio_ids ?? []),
  );

  useEffect(() => {
    if (open) {
      setNome(editing?.nome_completo ?? "");
      setRole(editing?.role ?? "lider");
      setSelected(new Set(editing?.ministerio_ids ?? []));
      setEmail("");
      setSenha("");
    }
  }, [open, editing]);

  function toggleMinisterio(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editing) {
          await atualizarUsuario({
            user_id: editing.id,
            nome_completo: nome,
            role,
            ministerio_ids: Array.from(selected),
          });
          toast.success("Usuário atualizado");
        } else {
          await criarUsuario({
            nome_completo: nome,
            email,
            senha,
            role,
            ministerio_ids: Array.from(selected),
          });
          toast.success("Usuário criado");
        }
        onOpenChange(false);
        setNome("");
        setEmail("");
        setSenha("");
        setRole("lider");
        setSelected(new Set());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(b) => {
        onOpenChange(b);
        if (!b) {
          setNome(editing?.nome_completo ?? "");
          setEmail("");
          setSenha("");
          setRole(editing?.role ?? "lider");
          setSelected(new Set(editing?.ministerio_ids ?? []));
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize nome, papel e ministérios."
              : "Defina o acesso inicial do líder."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          {!editing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha inicial</Label>
                <Input
                  id="senha"
                  type="text"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "lider" | "master")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lider">Líder</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ministérios</Label>
            <div className="space-y-2 rounded-md border p-3">
              {ministerios.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(m.id)}
                    onCheckedChange={() => toggleMinisterio(m.id)}
                  />
                  <span>{m.nome}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
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
