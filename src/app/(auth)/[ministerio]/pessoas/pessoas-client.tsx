"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QrCode, Settings2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import ContatoLista from "./contato-lista";
import ContatoKanban from "./contato-kanban";
import ColunasDialog from "./colunas-dialog";
import type {
  Contato,
  KanbanColuna,
  Ministerio,
} from "@/lib/database.types";

export default function PessoasClient({
  ministerio,
  contatosIniciais,
  colunasIniciais,
  isMaster,
}: {
  ministerio: Ministerio;
  contatosIniciais: Contato[];
  colunasIniciais: KanbanColuna[];
  isMaster: boolean;
}) {
  const supabase = createClient();
  const [contatos, setContatos] = useState(contatosIniciais);
  const [colunas, setColunas] = useState(colunasIniciais);
  const [colunasOpen, setColunasOpen] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`pessoas:${ministerio.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contatos",
          filter: `ministerio_id=eq.${ministerio.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("contatos")
            .select("*")
            .eq("ministerio_id", ministerio.id)
            .order("criado_em", { ascending: false });
          setContatos(data ?? []);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kanban_colunas" },
        async () => {
          const { data } = await supabase
            .from("kanban_colunas")
            .select("*")
            .order("ordem");
          setColunas(data ?? []);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, ministerio.id]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          Pessoas · {ministerio.nome}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/${ministerio.slug}/cadastro`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <QrCode className="size-4" /> Formulário
          </Link>
          {isMaster && (
            <Button
              variant="outline"
              onClick={() => setColunasOpen(true)}
            >
              <Settings2 className="size-4" /> Colunas
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>
        <TabsContent value="lista">
          <ContatoLista
            contatos={contatos}
            colunas={colunas}
            isMaster={isMaster}
          />
        </TabsContent>
        <TabsContent value="kanban">
          <ContatoKanban
            contatos={contatos}
            colunas={colunas}
            ministerioId={ministerio.id}
            setContatos={setContatos}
          />
        </TabsContent>
      </Tabs>

      {isMaster && (
        <ColunasDialog
          open={colunasOpen}
          onOpenChange={setColunasOpen}
          colunas={colunas}
        />
      )}
    </div>
  );
}
