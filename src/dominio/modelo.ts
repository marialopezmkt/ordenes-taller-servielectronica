// Modelo de datos del taller: ids, relaciones y estados (etapa 1 del encargo).
// Todo es puro: sin React, sin localStorage, sin fecha del sistema.

/** Fecha de calendario en formato YYYY-MM-DD. */
export type Fecha = string;

export type TipoEquipo = "notebook" | "pc" | "celular" | "tablet";

export const TIPOS_EQUIPO: { id: TipoEquipo; nombre: string }[] = [
  { id: "notebook", nombre: "Notebook" },
  { id: "pc", nombre: "PC" },
  { id: "celular", nombre: "Celular" },
  { id: "tablet", nombre: "Tablet" },
];

/** Quien dejó el equipo en el mostrador (datos sintéticos en la demo). */
export type Contacto = {
  nombre: string;
  telefono: string;
};

/** Equipo: se identifica por su serie o IMEI, que no se puede repetir. Id: EQ-0001. */
export type Equipo = {
  id: string;
  tipo: TipoEquipo;
  marca: string;
  modelo: string;
  serie: string;
  accesorios: string;
  estadoFisico: string;
  contacto: Contacto;
  ingresadoEn: Fecha;
};

export type EstadoOrden =
  | "ingresado"
  | "en_diagnostico"
  | "esperando_aprobacion"
  | "en_reparacion"
  | "esperando_repuesto"
  | "lista_para_retirar"
  | "entregado"
  | "sin_reparacion";

export const ESTADOS: { id: EstadoOrden; nombre: string }[] = [
  { id: "ingresado", nombre: "Ingresado" },
  { id: "en_diagnostico", nombre: "En diagnóstico" },
  { id: "esperando_aprobacion", nombre: "Esperando aprobación" },
  { id: "en_reparacion", nombre: "En reparación" },
  { id: "esperando_repuesto", nombre: "Esperando repuesto" },
  { id: "lista_para_retirar", nombre: "Lista para retirar" },
  { id: "entregado", nombre: "Entregado" },
  { id: "sin_reparacion", nombre: "Sin reparación" },
];

export const ESTADOS_FINALES: EstadoOrden[] = ["entregado", "sin_reparacion"];

export function nombreEstado(estado: EstadoOrden): string {
  return ESTADOS.find((e) => e.id === estado)?.nombre ?? estado;
}

export type IdAccion =
  | "iniciar_diagnostico"
  | "enviar_presupuesto"
  | "aprobar"
  | "rechazar"
  | "esperar_repuesto"
  | "terminar_reparacion"
  | "llego_repuesto"
  | "entregar"
  | "sin_arreglo";

export type Accion = { id: IdAccion; etiqueta: string; destino: EstadoOrden };

/** Tabla de transiciones del briefing: desde cada estado, solo estos pasos. */
export const TRANSICIONES: Record<EstadoOrden, Accion[]> = {
  ingresado: [
    { id: "iniciar_diagnostico", etiqueta: "Pasar a diagnóstico", destino: "en_diagnostico" },
  ],
  en_diagnostico: [
    { id: "enviar_presupuesto", etiqueta: "Pedir aprobación", destino: "esperando_aprobacion" },
  ],
  esperando_aprobacion: [
    { id: "aprobar", etiqueta: "Aprobó: reparar", destino: "en_reparacion" },
    { id: "rechazar", etiqueta: "Rechazó: a retiro", destino: "lista_para_retirar" },
  ],
  en_reparacion: [
    { id: "esperar_repuesto", etiqueta: "Esperar repuesto", destino: "esperando_repuesto" },
    { id: "terminar_reparacion", etiqueta: "Reparado: a retiro", destino: "lista_para_retirar" },
  ],
  esperando_repuesto: [
    { id: "llego_repuesto", etiqueta: "Llegó el repuesto", destino: "en_reparacion" },
  ],
  lista_para_retirar: [
    { id: "entregar", etiqueta: "Entregar", destino: "entregado" },
    { id: "sin_arreglo", etiqueta: "Sin reparación", destino: "sin_reparacion" },
  ],
  entregado: [],
  sin_reparacion: [],
};

/**
 * Servicio del catálogo: precio de mano de obra en pesos chilenos.
 * Nombre, tipos de equipo, precio y días son obligatorios.
 */
export type Servicio = {
  id: string;
  nombre: string;
  equipos: TipoEquipo[];
  precio: number;
  dias: number;
  /** Pausado: no se ofrece al cargar diagnósticos nuevos. */
  pausado: boolean;
};

export const ID_DIAGNOSTICO = "diagnostico";

export const TODOS_LOS_TIPOS: TipoEquipo[] = ["notebook", "pc", "celular", "tablet"];
const TODOS = TODOS_LOS_TIPOS;

/**
 * Catálogo inicial (el de ejemplo del encargo). Es la semilla: desde la app se
 * edita en la pantalla Catálogo y se guarda con los demás datos.
 */
export const CATALOGO_INICIAL: Servicio[] = ([

  { id: ID_DIAGNOSTICO, nombre: "Diagnóstico general", equipos: TODOS, precio: 10000, dias: 1 },
  { id: "formateo", nombre: "Formateo e instalación de sistema operativo", equipos: ["notebook", "pc"], precio: 25000, dias: 1 },
  { id: "limpieza", nombre: "Limpieza interna y cambio de pasta térmica", equipos: ["notebook", "pc"], precio: 22000, dias: 1 },
  { id: "ssd", nombre: "Cambio a disco SSD con copia de datos", equipos: ["notebook", "pc"], precio: 20000, dias: 1 },
  { id: "pantalla_notebook", nombre: "Cambio de pantalla de notebook", equipos: ["notebook"], precio: 30000, dias: 3 },
  { id: "bisagra", nombre: "Reparación de bisagra de notebook", equipos: ["notebook"], precio: 28000, dias: 2 },
  { id: "bateria_celular", nombre: "Cambio de batería de celular", equipos: ["celular"], precio: 18000, dias: 1 },
  { id: "pin_carga", nombre: "Cambio de pin de carga de celular", equipos: ["celular"], precio: 20000, dias: 2 },
  { id: "pantalla_celular", nombre: "Cambio de pantalla de celular o tablet", equipos: ["celular", "tablet"], precio: 25000, dias: 3 },
  { id: "recuperacion", nombre: "Recuperación de datos básica", equipos: TODOS, precio: 35000, dias: 3 },
] satisfies Omit<Servicio, "pausado">[]).map((s) => ({ ...s, pausado: false }));

// Parámetros de las reglas. Para cambiarlos, editá estos valores (ver README,
// sección «Reglas y pruebas»).
/** Días de garantía desde la entrega. */
export const DIAS_GARANTIA = 90;
/** Más de estos días en Lista para retirar muestra «Retiro atrasado». */
export const DIAS_RETIRO_ATRASADO = 30;

/** Servicio presupuestado en una orden (copia del precio al momento de cargarlo). */
export type LineaServicio = { servicioId: string; nombre: string; precio: number };

/** Repuesto: línea aparte con precio libre. */
export type LineaRepuesto = { descripcion: string; precio: number };

export type Presupuesto = "pendiente" | "aprobado" | "rechazado";

export type EventoHistorial = {
  fecha: Fecha;
  estado: EstadoOrden;
  nota: string;
};

/** Orden de trabajo: siempre cuelga de un equipo. Id = código OT-año-número. */
export type Orden = {
  id: string;
  equipoId: string;
  falla: string;
  diagnostico: string;
  servicios: LineaServicio[];
  repuestos: LineaRepuesto[];
  /** Precio del diagnóstico cuando se abrió la orden (no cambia si después se edita el catálogo). */
  precioDiagnostico: number;
  /** Total en CLP. Se recalcula y se guarda con cada cambio de la orden. */
  total: number;
  enGarantia: boolean;
  presupuesto: Presupuesto;
  /** Solo true si la orden pasó por En reparación y terminó reparada. */
  reparacionRealizada: boolean;
  /** Solo true si se terminó la reparación: un rechazo nunca consume repuestos. */
  repuestosConsumidos: boolean;
  estado: EstadoOrden;
  ingresadaEn: Fecha;
  historial: EventoHistorial[];
};

/** Todo lo que guarda la app: un solo documento que se persiste completo. */
export type DatosTaller = {
  version: 2;
  catalogo: Servicio[];
  equipos: Equipo[];
  ordenes: Orden[];
  /** Últimos números usados. Nunca bajan, así los códigos no se reutilizan. */
  correlativos: { equipo: number; servicio: number; ordenesPorAnio: Record<string, number> };
};

/** Datos vacíos con el catálogo inicial: punto de partida de la semilla y de los tests. */
export function datosVacios(): DatosTaller {
  return {
    version: 2,
    catalogo: CATALOGO_INICIAL.map((s) => ({ ...s, equipos: [...s.equipos] })),
    equipos: [],
    ordenes: [],
    correlativos: { equipo: 0, servicio: 0, ordenesPorAnio: {} },
  };
}

export type Resultado<T> =
  | { ok: true; valor: T }
  | { ok: false; error: string; equipoExistenteId?: string };
