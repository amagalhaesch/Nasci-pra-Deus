export function idadeEmAnos(dataNascimentoISO: string): number {
  const nasc = new Date(dataNascimentoISO);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export function celularApenasDigitos(celular: string): string {
  return celular.replace(/\D/g, "");
}

export function aplicarMascaraCelular(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function whatsAppLink(celular: string): string {
  const digitos = celularApenasDigitos(celular);
  const comDDI = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${comDDI}`;
}

export function mascararCelular(celular: string): string {
  const d = celularApenasDigitos(celular);
  if (d.length >= 6) {
    const ddd = d.slice(0, 2);
    const last4 = d.slice(-4);
    return `(${ddd}) *****-${last4}`;
  }
  return "***********";
}

export function formatarCelular(celular: string): string {
  const d = celularApenasDigitos(celular);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return celular;
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatarSegundos(total: number): string {
  if (total < 0) total = 0;
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}
