"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  idadeEmAnos,
  whatsAppLink,
  formatarCelular,
  mascararCelular,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import EditarContatoDialog from "./editar-contato-dialog";
import { excluirContato } from "./actions";
import type { Contato, KanbanColuna } from "@/lib/database.types";

type FaixaEtaria = "todos" | "menores" | "maiores";

export default function ContatoLista({
  contatos,
  colunas,
  isMaster,
  ministerioId,
}: {
  contatos: Contato[];
  colunas: KanbanColuna[];
  isMaster: boolean;
  ministerioId: string;
}) {
  const [busca, setBusca] = useState("");
  const [faixa, setFaixa] = useState<FaixaEtaria>("todos");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [editando, setEditando] = useState<Contato | null>(null);

  const colunaNome = (id: string) =>
    colunas.find((c) => c.id === id)?.nome ?? "—";

  const filtrados = useMemo(() => {
    const buscaLower = busca.trim().toLowerCase();
    return contatos.filter((c) => {
      if (buscaLower && !c.nome_completo.toLowerCase().includes(buscaLower)) {
        return false;
      }
      const idade = idadeEmAnos(c.data_nascimento);
      if (faixa === "menores" && idade >= 18) return false;
      if (faixa === "maiores" && idade < 18) return false;
      if (de && c.criado_em < de) return false;
      if (ate) {
        const ateLimite = `${ate}T23:59:59.999Z`;
        if (c.criado_em > ateLimite) return false;
      }
      return true;
    });
  }, [contatos, busca, faixa, de, ate]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="busca">Buscar por nome</Label>
            <Input
              id="busca"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome..."
            />
          </div>
          <div className="space-y-2">
            <Label>Faixa etária</Label>
            <Select value={faixa} onValueChange={(v) => setFaixa(v as FaixaEtaria)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="menores">Menores de 18</SelectItem>
                <SelectItem value="maiores">Maiores de 18</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cadastrado de / até</Label>
            <div className="flex gap-1">
              <Input
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
              />
              <Input
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        {filtrados.length} de {contatos.length} contato(s)
      </div>

      {/* Mobile: cards */}
      <div className="space-y-2 md:hidden">
        {filtrados.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum contato encontrado.
          </p>
        )}
        {filtrados.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{c.nome_completo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {idadeEmAnos(c.data_nascimento)} anos ·{" "}
                    {isMaster ? formatarCelular(c.celular) : mascararCelular(c.celular)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{colunaNome(c.coluna_id)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <WhatsAppButton celular={c.celular} contatoId={c.id} ministerioId={ministerioId} />
                  {isMaster && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => setEditando(c)}>
                        <Pencil className="size-4" />
                      </Button>
                      <ExcluirBtn id={c.id} nome={c.nome_completo} />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: tabela */}
      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome_completo}</TableCell>
                  <TableCell>{idadeEmAnos(c.data_nascimento)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {isMaster ? formatarCelular(c.celular) : mascararCelular(c.celular)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{colunaNome(c.coluna_id)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <WhatsAppButton celular={c.celular} contatoId={c.id} ministerioId={ministerioId} />
                    {isMaster && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditando(c)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <ExcluirBtn id={c.id} nome={c.nome_completo} />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditarContatoDialog
        contato={editando}
        onClose={() => setEditando(null)}
      />
    </div>
  );
}

function ExcluirBtn({ id, nome }: { id: string; nome: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Excluir ${nome}?`)) return;
        startTransition(async () => {
          try {
            await excluirContato(id);
            toast.success("Excluído");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro");
          }
        });
      }}
    >
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}
