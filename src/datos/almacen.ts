// Persistencia en localStorage: un solo documento con todos los datos de la demo.
import type { DatosTaller, Fecha, Resultado } from "@/dominio/modelo";
import { crearSemilla } from "./semilla";

/** Clave propia de la app. Si no existe, se carga la semilla. */
export const CLAVE_DATOS = "servielectronica-ot:datos";

/** Lo mínimo de Storage que usa la app (en los tests se reemplaza). */
export type Almacen = Pick<Storage, "getItem" | "setItem">;

function pareceDatos(x: unknown): x is DatosTaller {
  const d = x as DatosTaller;
  return (
    typeof d === "object" &&
    d !== null &&
    d.version === 1 &&
    Array.isArray(d.equipos) &&
    Array.isArray(d.ordenes) &&
    typeof d.correlativos?.equipo === "number"
  );
}

/**
 * Lee los datos guardados. Solo si la clave no existe arma la semilla y la guarda.
 * Si lo guardado está dañado no lo pisa: devuelve un error para mostrarlo.
 */
export function cargarDatos(
  almacen: Almacen | undefined,
  hoy: Fecha,
): Resultado<{ datos: DatosTaller; aviso?: string }> {
  const sinAlmacen = {
    ok: true as const,
    valor: {
      datos: crearSemilla(hoy),
      aviso: "Este navegador no deja guardar datos: vas a ver los de ejemplo, pero los cambios no se van a guardar.",
    },
  };
  if (!almacen) return sinAlmacen;
  let guardado: string | null;
  try {
    guardado = almacen.getItem(CLAVE_DATOS);
  } catch {
    return sinAlmacen;
  }

  if (guardado === null) {
    const datos = crearSemilla(hoy);
    const g = guardarDatos(almacen, datos);
    return { ok: true, valor: g.ok ? { datos } : { datos, aviso: g.error } };
  }

  try {
    const datos: unknown = JSON.parse(guardado);
    if (pareceDatos(datos)) return { ok: true, valor: { datos } };
  } catch {
    // cae al error de abajo
  }
  return {
    ok: false,
    error: "Los datos guardados en este navegador están dañados. Reiniciá los datos de ejemplo (ver README).",
  };
}

/** Guarda el documento completo. Si falla, avisa y no se da nada por guardado. */
export function guardarDatos(almacen: Almacen, datos: DatosTaller): Resultado<null> {
  try {
    almacen.setItem(CLAVE_DATOS, JSON.stringify(datos));
    return { ok: true, valor: null };
  } catch {
    return {
      ok: false,
      error: "No se pudo guardar en este navegador. Lo que escribiste sigue en pantalla: probá de nuevo.",
    };
  }
}
