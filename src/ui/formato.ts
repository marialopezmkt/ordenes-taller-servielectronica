import type { Fecha } from "@/dominio/modelo";

const pesos = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

/** Monto sin ambigüedad: CLP $10.000 (pesos chilenos, no dólares). */
export function formatoPesos(monto: number): string {
  const signo = monto < 0 ? "−" : "";
  return `${signo}CLP $${pesos.format(Math.abs(monto))}`;
}

/** 2026-11-20 → 20/11/2026 */
export function formatoFecha(fecha: Fecha): string {
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
}

export function haceDias(dias: number): string {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "hace 1 día";
  return `hace ${dias} días`;
}

/** Clases compartidas: objetivos de toque de 44 px como mínimo. */
export const estilos = {
  boton:
    "inline-flex min-h-11 items-center justify-center rounded-md bg-celeste px-4 font-semibold text-grafito transition-colors hover:bg-celeste/85 disabled:opacity-50",
  botonSecundario:
    "inline-flex min-h-11 items-center justify-center rounded-md border border-grafito/30 bg-blanco px-4 font-semibold text-grafito transition-colors hover:bg-fondo",
  campo:
    "mt-1 block min-h-11 w-full rounded-md border border-gris/50 bg-blanco px-3 py-2 text-base text-grafito",
  etiqueta: "block text-sm font-semibold text-grafito",
  panel: "rounded-lg border border-grafito/15 bg-blanco p-4",
  enlace: "font-semibold text-grafito underline decoration-celeste decoration-2 underline-offset-4",
  /** Enlace que va solo (no dentro de una frase): 44 px de alto para tocarlo con el dedo. */
  enlaceSuelto:
    "inline-flex min-h-11 items-center font-semibold text-grafito underline decoration-celeste decoration-2 underline-offset-4",
};
