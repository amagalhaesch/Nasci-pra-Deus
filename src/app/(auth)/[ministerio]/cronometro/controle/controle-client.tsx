"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, Upload, Trash2, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { calcularRestante, normalizarExtensao } from "@/lib/cronometro";
import { formatarSegundos } from "@/lib/format";
import type {
  CronometroEstado,
  CronometroImagem,
  Ministerio,
} from "@/lib/database.types";

const BUCKET = "cronometro-imagens";

export default function ControleClient({
  ministerio,
  estadoInicial,
  imagensIniciais,
}: {
  ministerio: Ministerio;
  estadoInicial: CronometroEstado;
  imagensIniciais: CronometroImagem[];
}) {
  const supabase = createClient();
  const [estado, setEstado] = useState<CronometroEstado>(estadoInicial);
  const [imagens, setImagens] = useState<CronometroImagem[]>(imagensIniciais);
  const [restante, setRestante] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tick a cada 250ms — inicia no cliente para evitar hydration mismatch com Date.now()
  useEffect(() => {
    setRestante(calcularRestante(estado));
    const id = setInterval(() => setRestante(calcularRestante(estado)), 250);
    return () => clearInterval(id);
  }, [estado]);

  // realtime
  useEffect(() => {
    const channel = supabase
      .channel(`cronometro-controle:${ministerio.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "cronometro_estado",
          filter: `ministerio_id=eq.${ministerio.id}`,
        },
        (payload) => setEstado(payload.new as CronometroEstado),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cronometro_imagens",
          filter: `ministerio_id=eq.${ministerio.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("cronometro_imagens")
            .select("*")
            .eq("ministerio_id", ministerio.id)
            .order("ordem");
          setImagens(data ?? []);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, ministerio.id]);

  async function atualizarEstado(patch: Partial<CronometroEstado>) {
    const novoEstado = { ...estado, ...patch };
    setEstado(novoEstado); // optimistic
    const { error } = await supabase
      .from("cronometro_estado")
      .update(patch)
      .eq("ministerio_id", ministerio.id);
    if (error) {
      toast.error(error.message);
      setEstado(estado); // rollback
    }
  }

  function iniciar() {
    const base =
      estado.modo === "pausado"
        ? estado.restante_ao_pausar_segundos ?? estado.duracao_segundos
        : estado.duracao_segundos;
    atualizarEstado({
      modo: "rodando",
      started_at: new Date().toISOString(),
      restante_ao_pausar_segundos: base,
    });
  }

  function pausar() {
    atualizarEstado({
      modo: "pausado",
      restante_ao_pausar_segundos: calcularRestante(estado),
      started_at: null,
    });
  }

  function resetar() {
    atualizarEstado({
      modo: "parado",
      started_at: null,
      restante_ao_pausar_segundos: null,
    });
  }

  function ajustarDuracao(min: number) {
    const seg = Math.max(10, Math.round(min * 60));
    atualizarEstado({
      modo: "parado",
      duracao_segundos: seg,
      started_at: null,
      restante_ao_pausar_segundos: null,
    });
  }

  function ajustarIntervalo(seg: number) {
    atualizarEstado({ intervalo_carrossel_segundos: Math.max(1, seg) });
  }

  async function uploadImagens(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const proximaOrdem =
        imagens.length === 0
          ? 0
          : Math.max(...imagens.map((i) => i.ordem)) + 1;

      let idx = 0;
      for (const file of Array.from(files)) {
        const safeName = normalizarExtensao(file.name).replace(/\s+/g, "-");
        const path = `${ministerio.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            contentType: file.type === "image/jfif" ? "image/jpeg" : file.type,
            upsert: false,
          });
        if (upErr) {
          toast.error(`${file.name}: ${upErr.message}`);
          continue;
        }
        const { error: dbErr } = await supabase
          .from("cronometro_imagens")
          .insert({
            ministerio_id: ministerio.id,
            storage_path: path,
            ordem: proximaOrdem + idx,
          });
        if (dbErr) {
          toast.error(`${file.name}: ${dbErr.message}`);
          await supabase.storage.from(BUCKET).remove([path]);
        }
        idx++;
      }
      toast.success(`${idx} imagem(ns) enviada(s)`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deletarImagem(img: CronometroImagem) {
    if (!confirm("Excluir imagem?")) return;
    await supabase.storage.from(BUCKET).remove([img.storage_path]);
    await supabase.from("cronometro_imagens").delete().eq("id", img.id);
  }

  async function moverImagem(img: CronometroImagem, direcao: -1 | 1) {
    const idx = imagens.findIndex((i) => i.id === img.id);
    const vizinhoIdx = idx + direcao;
    if (vizinhoIdx < 0 || vizinhoIdx >= imagens.length) return;
    const vizinho = imagens[vizinhoIdx];
    await Promise.all([
      supabase
        .from("cronometro_imagens")
        .update({ ordem: vizinho.ordem })
        .eq("id", img.id),
      supabase
        .from("cronometro_imagens")
        .update({ ordem: img.ordem })
        .eq("id", vizinho.id),
    ]);
  }

  function urlPublica(path: string) {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Cronômetro · {ministerio.nome}
        </h1>
        <Link
          href={`/${ministerio.slug}/cronometro/apresentacao`}
          target="_blank"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <ExternalLink className="size-4" /> Abrir apresentação
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="font-mono text-7xl md:text-8xl tabular-nums">
              {restante !== null ? formatarSegundos(restante) : "--:--"}
            </div>
            <div className="mt-2 text-sm uppercase tracking-wide text-muted-foreground">
              {estado.modo}
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {estado.modo !== "rodando" ? (
              <Button size="lg" onClick={iniciar}>
                <Play className="size-4" /> Iniciar
              </Button>
            ) : (
              <Button size="lg" onClick={pausar} variant="secondary">
                <Pause className="size-4" /> Pausar
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={resetar}>
              <RotateCcw className="size-4" /> Resetar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="duracao">Duração (mm:ss)</Label>
              <Input
                id="duracao"
                key={estado.duracao_segundos}
                placeholder="ex: 15:00"
                defaultValue={formatarSegundos(estado.duracao_segundos)}
                disabled={estado.modo === "rodando"}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  const partes = val.split(":").map(Number);
                  let seg: number;
                  if (partes.length === 2) {
                    seg = partes[0] * 60 + partes[1];
                  } else {
                    seg = partes[0];
                  }
                  if (!isNaN(seg) && seg >= 10) {
                    ajustarDuracao(seg / 60);
                  } else {
                    e.target.value = formatarSegundos(estado.duracao_segundos);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="intervalo">Intervalo carrossel (s)</Label>
              <Input
                id="intervalo"
                key={estado.intervalo_carrossel_segundos}
                type="number"
                min={1}
                max={300}
                placeholder="ex: 10"
                defaultValue={estado.intervalo_carrossel_segundos}
                onBlur={(e) => {
                  const seg = parseInt(e.target.value, 10);
                  if (!isNaN(seg) && seg >= 1) {
                    ajustarIntervalo(seg);
                  } else {
                    e.target.value = String(estado.intervalo_carrossel_segundos);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor de fundo</Label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "Preto", cor: "#000000" },
                { label: "Verde escuro", cor: "#1a2e23" },
                { label: "Azul marinho", cor: "#0f172a" },
                { label: "Roxo", cor: "#1e0a3c" },
                { label: "Vinho", cor: "#3b0a1e" },
                { label: "Branco", cor: "#ffffff" },
              ].map(({ label, cor }) => (
                <button
                  key={cor}
                  title={label}
                  onClick={() => atualizarEstado({ cor_fundo: cor })}
                  className="size-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: cor,
                    borderColor:
                      estado.cor_fundo === cor ? "#3e644f" : "transparent",
                    outline:
                      estado.cor_fundo === cor
                        ? "2px solid #3e644f"
                        : "2px solid transparent",
                    outlineOffset: "2px",
                  }}
                />
              ))}
              <label
                title="Cor personalizada"
                className="relative size-8 cursor-pointer rounded-full border-2 border-dashed border-muted-foreground overflow-hidden hover:scale-110 transition-transform"
                style={{
                  borderColor:
                    !["#000000", "#1a2e23", "#0f172a", "#1e0a3c", "#3b0a1e", "#ffffff"].includes(
                      estado.cor_fundo
                    )
                      ? "#3e644f"
                      : undefined,
                  background:
                    "linear-gradient(135deg, red, orange, yellow, green, blue, violet)",
                }}
              >
                <input
                  type="color"
                  value={estado.cor_fundo}
                  onChange={(e) => atualizarEstado({ cor_fundo: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
              <span className="text-sm text-muted-foreground font-mono">
                {estado.cor_fundo}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Galeria ({imagens.length})</CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.jfif,image/*"
              className="hidden"
              onChange={(e) => uploadImagens(e.target.files)}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="size-4" />
              {uploading ? "Enviando..." : "Enviar imagens"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {imagens.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma imagem enviada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagens.map((img, idx) => (
                <div key={img.id} className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlPublica(img.storage_path)}
                    alt=""
                    className="aspect-video w-full rounded-md border object-cover"
                  />
                  <div className="flex gap-1 justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => moverImagem(img, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={idx === imagens.length - 1}
                      onClick={() => moverImagem(img, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deletarImagem(img)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
