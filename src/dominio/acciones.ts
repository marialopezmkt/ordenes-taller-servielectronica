// Acciones de negocio: reciben los datos y devuelven datos nuevos, sin tocar los
// originales. Si una validación falla devuelven { ok: false } y nada cambia
// (ni estados, ni totales, ni correlativos).
import {
  CATALOGO,
  ID_DIAGNOSTICO,
  TRANSICIONES,
  nombreEstado,
  type DatosTaller,
  type Equipo,
  type Fecha,
  type IdAccion,
  type LineaRepuesto,
  type Orden,
  type Resultado,
} from "./modelo";
import { buscarEquipoPorSerie, desglose, garantiaVigente, ordenAbierta } from "./reglas";

/** Toda orden se guarda con su total al día. */
function conTotal(orden: Orden): Orden {
  return { ...orden, total: desglose(orden).total };
}

export type NuevoEquipo = Omit<Equipo, "id" | "ingresadoEn">;

export function codigoOrden(anio: string, numero: number): string {
  return `OT-${anio}-${String(numero).padStart(3, "0")}`;
}

export function crearEquipo(
  datos: DatosTaller,
  nuevo: NuevoEquipo,
  hoy: Fecha,
): Resultado<{ datos: DatosTaller; equipo: Equipo }> {
  const serie = nuevo.serie.trim();
  if (!serie) return { ok: false, error: "Falta el número de serie o IMEI." };
  if (!nuevo.marca.trim() || !nuevo.modelo.trim()) {
    return { ok: false, error: "Falta la marca o el modelo." };
  }
  if (!nuevo.contacto.nombre.trim()) {
    return { ok: false, error: "Falta el nombre de quien deja el equipo." };
  }
  const existente = buscarEquipoPorSerie(datos.equipos, serie);
  if (existente) {
    return {
      ok: false,
      error: `La serie ${serie} ya está registrada en la ficha ${existente.id} (${existente.marca} ${existente.modelo}).`,
      equipoExistenteId: existente.id,
    };
  }
  const numero = datos.correlativos.equipo + 1;
  const equipo: Equipo = {
    ...nuevo,
    serie,
    id: `EQ-${String(numero).padStart(4, "0")}`,
    ingresadoEn: hoy,
  };
  return {
    ok: true,
    valor: {
      equipo,
      datos: {
        ...datos,
        equipos: [...datos.equipos, equipo],
        correlativos: { ...datos.correlativos, equipo: numero },
      },
    },
  };
}

export function abrirOrden(
  datos: DatosTaller,
  equipoId: string,
  falla: string,
  hoy: Fecha,
): Resultado<{ datos: DatosTaller; orden: Orden }> {
  if (!datos.equipos.some((e) => e.id === equipoId)) {
    return { ok: false, error: "No existe ese equipo." };
  }
  const abierta = ordenAbierta(datos.ordenes, equipoId);
  if (abierta) {
    return {
      ok: false,
      error: `Este equipo ya tiene la orden ${abierta.id} abierta (${nombreEstado(abierta.estado)}). Cerrala antes de abrir otra.`,
    };
  }
  if (!falla.trim()) return { ok: false, error: "Contá qué falla tiene el equipo." };

  const anio = hoy.slice(0, 4);
  const numero = (datos.correlativos.ordenesPorAnio[anio] ?? 0) + 1;
  const enGarantia = garantiaVigente(datos.ordenes, equipoId, hoy) !== undefined;
  const orden: Orden = conTotal({
    id: codigoOrden(anio, numero),
    equipoId,
    falla: falla.trim(),
    diagnostico: "",
    servicios: [],
    repuestos: [],
    total: 0,
    enGarantia,
    presupuesto: "pendiente",
    reparacionRealizada: false,
    repuestosConsumidos: false,
    estado: "ingresado",
    ingresadaEn: hoy,
    historial: [
      { fecha: hoy, estado: "ingresado", nota: enGarantia ? "Ingresó en garantía" : "Ingresó al taller" },
    ],
  });
  return {
    ok: true,
    valor: {
      orden,
      datos: {
        ...datos,
        ordenes: [...datos.ordenes, orden],
        correlativos: {
          ...datos.correlativos,
          ordenesPorAnio: { ...datos.correlativos.ordenesPorAnio, [anio]: numero },
        },
      },
    },
  };
}

function reemplazarOrden(datos: DatosTaller, orden: Orden): DatosTaller {
  return { ...datos, ordenes: datos.ordenes.map((o) => (o.id === orden.id ? orden : o)) };
}

/** Diagnóstico y presupuesto: solo se cargan mientras la orden está En diagnóstico. */
export function cargarDiagnostico(
  datos: DatosTaller,
  ordenId: string,
  carga: { diagnostico: string; servicioIds: string[]; repuestos: LineaRepuesto[] },
): Resultado<{ datos: DatosTaller; orden: Orden }> {
  const orden = datos.ordenes.find((o) => o.id === ordenId);
  if (!orden) return { ok: false, error: "No existe esa orden." };
  if (orden.estado !== "en_diagnostico") {
    return { ok: false, error: "El diagnóstico solo se carga con la orden En diagnóstico." };
  }
  const equipo = datos.equipos.find((e) => e.id === orden.equipoId);
  if (!equipo) return { ok: false, error: "No existe el equipo de esta orden." };

  const servicios = [];
  for (const id of carga.servicioIds) {
    const s = CATALOGO.find((c) => c.id === id);
    if (!s || s.id === ID_DIAGNOSTICO) return { ok: false, error: "Servicio no válido." };
    if (!s.equipos.includes(equipo.tipo)) {
      return { ok: false, error: `«${s.nombre}» no corresponde a este tipo de equipo.` };
    }
    servicios.push({ servicioId: s.id, nombre: s.nombre, precio: s.precio });
  }
  for (const r of carga.repuestos) {
    if (!r.descripcion.trim()) return { ok: false, error: "Falta la descripción de un repuesto." };
    if (!Number.isInteger(r.precio) || r.precio < 0) {
      return { ok: false, error: "El precio del repuesto tiene que ser un número entero, sin decimales." };
    }
  }
  const nueva: Orden = conTotal({
    ...orden,
    diagnostico: carga.diagnostico.trim(),
    servicios,
    repuestos: carga.repuestos.map((r) => ({ descripcion: r.descripcion.trim(), precio: r.precio })),
  });
  return { ok: true, valor: { orden: nueva, datos: reemplazarOrden(datos, nueva) } };
}

const NOTAS: Record<IdAccion, string> = {
  iniciar_diagnostico: "Empezó el diagnóstico",
  enviar_presupuesto: "Presupuesto enviado al cliente",
  aprobar: "El cliente aprobó el presupuesto",
  rechazar: "El cliente rechazó el presupuesto: se cobra solo el diagnóstico",
  esperar_repuesto: "Se espera un repuesto",
  terminar_reparacion: "Reparación terminada",
  llego_repuesto: "Llegó el repuesto",
  entregar: "Equipo entregado al cliente",
  sin_arreglo: "No hubo arreglo posible",
};

/** Aplica un paso de la tabla de transiciones. Cualquier otro paso se rechaza. */
export function aplicarAccion(
  datos: DatosTaller,
  ordenId: string,
  accionId: IdAccion,
  hoy: Fecha,
): Resultado<{ datos: DatosTaller; orden: Orden }> {
  const orden = datos.ordenes.find((o) => o.id === ordenId);
  if (!orden) return { ok: false, error: "No existe esa orden." };
  const accion = TRANSICIONES[orden.estado].find((a) => a.id === accionId);
  if (!accion) {
    return { ok: false, error: `Ese paso no está permitido desde «${nombreEstado(orden.estado)}».` };
  }
  if (accionId === "enviar_presupuesto" && !orden.diagnostico) {
    return { ok: false, error: "Cargá el diagnóstico antes de pedir aprobación." };
  }

  const nueva: Orden = {
    ...orden,
    estado: accion.destino,
    historial: [...orden.historial, { fecha: hoy, estado: accion.destino, nota: NOTAS[accionId] }],
  };
  if (accionId === "aprobar") nueva.presupuesto = "aprobado";
  if (accionId === "rechazar") {
    // Cierre rechazado sin falsa reparación.
    nueva.presupuesto = "rechazado";
    nueva.reparacionRealizada = false;
    nueva.repuestosConsumidos = false;
  }
  if (accionId === "terminar_reparacion") {
    nueva.reparacionRealizada = true;
    nueva.repuestosConsumidos = true;
  }
  if (accionId === "sin_arreglo") nueva.reparacionRealizada = false;

  const final = conTotal(nueva);
  return { ok: true, valor: { orden: final, datos: reemplazarOrden(datos, final) } };
}
