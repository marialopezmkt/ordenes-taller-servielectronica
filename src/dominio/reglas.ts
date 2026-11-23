// Consultas puras sobre los datos: no modifican nada.
import { diasEntre } from "./fechas";
import {
  DIAS_GARANTIA,
  DIAS_RETIRO_ATRASADO,
  ESTADOS_FINALES,
  TRANSICIONES,
  type Accion,
  type DatosTaller,
  type Equipo,
  type EstadoOrden,
  type Fecha,
  type Orden,
  type TipoEquipo,
} from "./modelo";

/** Serie/IMEI comparable: sin espacios ni guiones, en mayúsculas. */
export function normalizarSerie(serie: string): string {
  return serie.replace(/[\s-]/g, "").toUpperCase();
}

export function buscarEquipoPorSerie(equipos: Equipo[], serie: string): Equipo | undefined {
  const buscada = normalizarSerie(serie);
  return equipos.find((e) => normalizarSerie(e.serie) === buscada);
}

export function esFinal(estado: EstadoOrden): boolean {
  return ESTADOS_FINALES.includes(estado);
}

export function ordenAbierta(ordenes: Orden[], equipoId: string): Orden | undefined {
  return ordenes.find((o) => o.equipoId === equipoId && !esFinal(o.estado));
}

/** Pasos que se ofrecen desde el estado actual. Los finales no tienen ninguno. */
export function accionesDisponibles(orden: Orden): Accion[] {
  return TRANSICIONES[orden.estado];
}

/** Fecha en que la orden entró por última vez a un estado. */
export function fechaDeEstado(orden: Orden, estado: EstadoOrden): Fecha | undefined {
  for (let i = orden.historial.length - 1; i >= 0; i--) {
    if (orden.historial[i].estado === estado) return orden.historial[i].fecha;
  }
  return undefined;
}

/** Días que lleva la orden en su estado actual. */
export function diasEnEstado(orden: Orden, hoy: Fecha): number {
  return diasEntre(fechaDeEstado(orden, orden.estado) ?? orden.ingresadaEn, hoy);
}

/** Días desde que la orden ingresó al taller. */
export function antiguedad(orden: Orden, hoy: Fecha): number {
  return diasEntre(orden.ingresadaEn, hoy);
}

export function retiroAtrasado(orden: Orden, hoy: Fecha): boolean {
  return orden.estado === "lista_para_retirar" && diasEnEstado(orden, hoy) > DIAS_RETIRO_ATRASADO;
}

/**
 * Última entrega con reparación realizada que todavía cubre la garantía.
 * Una orden rechazada y retirada no da garantía: no hubo reparación.
 */
export function garantiaVigente(
  ordenes: Orden[],
  equipoId: string,
  hoy: Fecha,
): { orden: Orden; entregadoEn: Fecha; diasRestantes: number } | undefined {
  let mejor: { orden: Orden; entregadoEn: Fecha; diasRestantes: number } | undefined;
  for (const orden of ordenes) {
    if (orden.equipoId !== equipoId || orden.estado !== "entregado" || !orden.reparacionRealizada) continue;
    const entregadoEn = fechaDeEstado(orden, "entregado");
    if (!entregadoEn) continue;
    const dias = diasEntre(entregadoEn, hoy);
    if (dias < 0 || dias > DIAS_GARANTIA) continue;
    if (!mejor || entregadoEn > mejor.entregadoEn) {
      mejor = { orden, entregadoEn, diasRestantes: DIAS_GARANTIA - dias };
    }
  }
  return mejor;
}

/**
 * Entrega de los últimos 90 días que NO da garantía porque no hubo reparación
 * (por ejemplo, presupuesto rechazado). Sirve para explicarlo en pantalla.
 */
export function entregaSinReparacion(
  ordenes: Orden[],
  equipoId: string,
  hoy: Fecha,
): { orden: Orden; entregadoEn: Fecha } | undefined {
  let ultima: { orden: Orden; entregadoEn: Fecha } | undefined;
  for (const orden of ordenes) {
    if (orden.equipoId !== equipoId || orden.estado !== "entregado" || orden.reparacionRealizada) continue;
    const entregadoEn = fechaDeEstado(orden, "entregado");
    if (!entregadoEn) continue;
    const dias = diasEntre(entregadoEn, hoy);
    if (dias < 0 || dias > DIAS_GARANTIA) continue;
    if (!ultima || entregadoEn > ultima.entregadoEn) ultima = { orden, entregadoEn };
  }
  return ultima;
}

export type LineaDesglose = { concepto: string; monto: number };
export type Desglose = { lineas: LineaDesglose[]; total: number };

/**
 * Total de la orden, línea por línea para que se vea en pantalla.
 * - Pendiente: diagnóstico + servicios + repuestos (presupuesto completo).
 * - Aprobado: el diagnóstico se descuenta del total.
 * - Rechazado: el total queda en el precio del diagnóstico; ni servicios ni repuestos.
 * - En garantía: la mano de obra (diagnóstico y servicios) va en cero; los repuestos se cobran.
 */
export function desglose(orden: Orden): Desglose {
  const garantia = orden.enGarantia;
  const diag = garantia ? 0 : orden.precioDiagnostico;
  const lineas: LineaDesglose[] = [
    { concepto: garantia ? "Diagnóstico (en garantía)" : "Diagnóstico", monto: diag },
  ];
  if (orden.presupuesto !== "rechazado") {
    for (const s of orden.servicios) {
      lineas.push({ concepto: garantia ? `${s.nombre} (en garantía)` : s.nombre, monto: garantia ? 0 : s.precio });
    }
    for (const r of orden.repuestos) {
      lineas.push({ concepto: `Repuesto: ${r.descripcion}`, monto: r.precio });
    }
  }
  if (orden.presupuesto === "aprobado" && diag > 0) {
    lineas.push({ concepto: "Descuento del diagnóstico (aprobó)", monto: -diag });
  }
  return { lineas, total: lineas.reduce((t, l) => t + l.monto, 0) };
}

export type FiltroDias = "todos" | "hasta7" | "8a30" | "mas30";

export const FILTROS_DIAS: { id: FiltroDias; nombre: string }[] = [
  { id: "todos", nombre: "Cualquier antigüedad" },
  { id: "hasta7", nombre: "Hasta 7 días" },
  { id: "8a30", nombre: "De 8 a 30 días" },
  { id: "mas30", nombre: "Más de 30 días" },
];

export type Filtros = {
  estado: EstadoOrden | "todos";
  tipo: TipoEquipo | "todos";
  dias: FiltroDias;
};

function cumpleDias(dias: number, filtro: FiltroDias): boolean {
  if (filtro === "hasta7") return dias <= 7;
  if (filtro === "8a30") return dias >= 8 && dias <= 30;
  if (filtro === "mas30") return dias > 30;
  return true;
}

/** Los tres filtros se combinan (Y lógico). El contador es el largo de esta lista. */
export function filtrarOrdenes(datos: DatosTaller, filtros: Filtros, hoy: Fecha): Orden[] {
  return datos.ordenes.filter((o) => {
    if (filtros.estado !== "todos" && o.estado !== filtros.estado) return false;
    if (filtros.tipo !== "todos") {
      const equipo = datos.equipos.find((e) => e.id === o.equipoId);
      if (equipo?.tipo !== filtros.tipo) return false;
    }
    return cumpleDias(antiguedad(o, hoy), filtros.dias);
  });
}
