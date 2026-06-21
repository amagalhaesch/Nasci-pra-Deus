"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calcularRestante } from "@/lib/cronometro";
import { formatarSegundos } from "@/lib/format";
import type {
  CronometroEstado,
  CronometroImagem,
} from "@/lib/database.types";

const BUCKET = "cronometro-imagens";

function corFundoClara(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // luminância relativa (W3C)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function ApresentacaoClient({
  ministerioId,
  estadoInicial,
  imagensIniciais,
}: {
  ministerioId: string;
  estadoInicial: CronometroEstado;
  imagensIniciais: CronometroImagem[];
}) {
  const supabase = createClient();
  const [estado, setEstado] = useState(estadoInicial);
  const [imagens, setImagens] = useState(imagensIniciais);
  const [restante, setRestante] = useState<number | null>(null);
  const [carrosselIdx, setCarrosselIdx] = useState(0);

  // tick countdown — inicia no cliente para evitar hydration mismatch com Date.now()
  useEffect(() => {
    setRestante(calcularRestante(estado));
    const id = setInterval(() => setRestante(calcularRestante(estado)), 250);
    return () => clearInterval(id);
  }, [estado]);

  // tick carrossel
  useEffect(() => {
    if (imagens.length === 0) return;
    const id = setInterval(
      () => setCarrosselIdx((i) => (i + 1) % imagens.length),
      estado.intervalo_carrossel_segundos * 1000,
    );
    return () => clearInterval(id);
  }, [imagens.length, estado.intervalo_carrossel_segundos]);

  // garante que o índice fica válido se imagens diminuírem
  useEffect(() => {
    if (carrosselIdx >= imagens.length && imagens.length > 0) {
      setCarrosselIdx(0);
    }
  }, [imagens.length, carrosselIdx]);

  // realtime
  useEffect(() => {
    const channel = supabase
      .channel(`cronometro-apresentacao:${ministerioId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "cronometro_estado",
          filter: `ministerio_id=eq.${ministerioId}`,
        },
        (payload) => setEstado(payload.new as CronometroEstado),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cronometro_imagens",
          filter: `ministerio_id=eq.${ministerioId}`,
        },
        async () => {
          const { data } = await supabase
            .from("cronometro_imagens")
            .select("*")
            .eq("ministerio_id", ministerioId)
            .order("ordem");
          setImagens(data ?? []);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, ministerioId]);

  const urlAtual =
    imagens.length > 0
      ? supabase.storage
          .from(BUCKET)
          .getPublicUrl(imagens[carrosselIdx % imagens.length].storage_path).data
          .publicUrl
      : null;

  const temImagem = urlAtual !== null;
  const textColor = corFundoClara(estado.cor_fundo) ? "#000000" : "#ffffff";

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: estado.cor_fundo }}
    >
      {temImagem && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={urlAtual}
          src={urlAtual}
          alt=""
          className="absolute inset-0 h-full w-full object-contain opacity-90 transition-opacity duration-500"
        />
      )}
      {temImagem && <div className="absolute inset-0 bg-black/40" />}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="font-mono tabular-nums drop-shadow-2xl"
          style={{
            fontSize: "clamp(8rem, 30vw, 30rem)",
            lineHeight: 1,
            color: temImagem ? "#ffffff" : textColor,
          }}
        >
          {restante !== null ? formatarSegundos(restante) : ""}
        </div>
      </div>
    </div>
  );
}
