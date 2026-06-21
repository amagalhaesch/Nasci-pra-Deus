"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastrarContato } from "./actions";
import { formatarCelular } from "@/lib/format";

export default function CadastroForm({
  ministerioId,
  ministerioNome,
}: {
  ministerioId: string;
  ministerioNome: string;
}) {
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [celular, setCelular] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await cadastrarContato({
          ministerio_id: ministerioId,
          nome_completo: nome.trim(),
          data_nascimento: data,
          celular: celular.replace(/\D/g, ""),
        });
        setSucesso(true);
        setNome("");
        setData("");
        setCelular("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao cadastrar");
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-background px-6 py-10">
      <div className="w-full max-w-sm flex-1 flex flex-col justify-center space-y-8">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-primary">{ministerioNome}</h1>
          <p className="text-sm text-muted-foreground">
            Que bom ter você aqui. Vamos começar!
          </p>
        </div>

        {sucesso ? (
          <div className="text-center space-y-4 py-6">
            <CheckCircle2 className="size-16 mx-auto text-primary" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">Cadastro recebido!</p>
              <p className="text-sm text-muted-foreground">
                Obrigado por se conectar com a gente.
              </p>
            </div>
            <Button onClick={() => setSucesso(false)} className="w-full h-12">
              Novo cadastro
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                required
                autoComplete="name"
                inputMode="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-12 text-base bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data">Data de nascimento</Label>
              <Input
                id="data"
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-12 text-base bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                value={celular}
                onChange={(e) => setCelular(formatarCelular(e.target.value))}
                className="h-12 text-base bg-card"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={pending}
            >
              {pending ? "Enviando..." : "Enviar →"}
            </Button>
          </form>
        )}
      </div>

      <p className="mt-8 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Nasci pra Deus
      </p>
    </div>
  );
}
