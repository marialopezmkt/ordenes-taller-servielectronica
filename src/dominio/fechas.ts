import type { Fecha } from "./modelo";

// Las fechas son cadenas YYYY-MM-DD. La aritmética usa Date.UTC para que el
// huso horario del navegador no corra un día.

function aUTC(fecha: Fecha): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

/** Días completos de `desde` a `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: Fecha, hasta: Fecha): number {
  return Math.round((aUTC(hasta) - aUTC(desde)) / 86_400_000);
}

export function sumarDias(fecha: Fecha, dias: number): Fecha {
  return new Date(aUTC(fecha) + dias * 86_400_000).toISOString().slice(0, 10);
}

/** Único lugar que lee el reloj local. */
export function hoyLocal(): Fecha {
  const ahora = new Date();
  const m = String(ahora.getMonth() + 1).padStart(2, "0");
  const d = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${m}-${d}`;
}
