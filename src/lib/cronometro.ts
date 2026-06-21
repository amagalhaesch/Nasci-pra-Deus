import type { CronometroEstado } from "@/lib/database.types";

export function calcularRestante(
  estado: CronometroEstado,
  agora: number = Date.now(),
): number {
  if (estado.modo === "parado") return estado.duracao_segundos;
  if (estado.modo === "pausado") {
    return estado.restante_ao_pausar_segundos ?? estado.duracao_segundos;
  }
  // rodando
  const baseSeg =
    estado.restante_ao_pausar_segundos ?? estado.duracao_segundos;
  const startedMs = estado.started_at ? Date.parse(estado.started_at) : agora;
  const decorridoSeg = Math.max(0, Math.floor((agora - startedMs) / 1000));
  return Math.max(0, baseSeg - decorridoSeg);
}

export const EXTENSOES_IMAGEM_ACEITAS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/jpg",
];

export function normalizarExtensao(fileName: string): string {
  const lower = fileName.toLowerCase();
  // .jfif é JPEG por baixo — renomear pra .jpg
  if (lower.endsWith(".jfif")) return fileName.slice(0, -5) + ".jpg";
  return fileName;
}
