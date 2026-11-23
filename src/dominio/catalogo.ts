// Gestión del catálogo de servicios: alta, edición, pausa y borrado.
// Igual que las demás acciones: devuelven datos nuevos y, si algo no valida,
// { ok: false } sin cambiar nada.
import {
  ID_DIAGNOSTICO,
  TODOS_LOS_TIPOS,
  type DatosTaller,
  type Orden,
  type Resultado,
  type Servicio,
  type TipoEquipo,
} from "./modelo";
import { esFinal } from "./reglas";

/** Lo que se completa en el formulario: los cuatro atributos obligatorios. */
export type DatosServicio = {
  nombre: string;
  equipos: TipoEquipo[];
  precio: number;
  dias: number;
};

function validar(catalogo: Servicio[], d: DatosServicio, idActual?: string): string | null {
  const nombre = d.nombre.trim();
  if (!nombre) return "Falta el nombre del servicio.";
  const repetido = catalogo.find(
    (s) => s.id !== idActual && s.nombre.trim().toLowerCase() === nombre.toLowerCase(),
  );
  if (repetido) return `Ya existe un servicio llamado «${repetido.nombre}».`;
  if (d.equipos.length === 0) return "Elegí al menos un tipo de equipo.";
  if (!Number.isInteger(d.precio) || d.precio <= 0) {
    return "El precio tiene que ser un número entero mayor que cero, sin decimales.";
  }
  if (!Number.isInteger(d.dias) || d.dias < 1) return "Los días tienen que ser un número entero, 1 o más.";
  if (idActual === ID_DIAGNOSTICO && d.equipos.length !== TODOS_LOS_TIPOS.length) {
    return "El Diagnóstico general aplica a todos los tipos de equipo.";
  }
  return null;
}

function limpio(d: DatosServicio): DatosServicio {
  // Los tipos se guardan en el orden de siempre, sin repetidos.
  return { ...d, nombre: d.nombre.trim(), equipos: TODOS_LOS_TIPOS.filter((t) => d.equipos.includes(t)) };
}

export function crearServicio(
  datos: DatosTaller,
  nuevo: DatosServicio,
): Resultado<{ datos: DatosTaller; servicio: Servicio }> {
  const error = validar(datos.catalogo, nuevo);
  if (error) return { ok: false, error };
  const numero = datos.correlativos.servicio + 1;
  const servicio: Servicio = { ...limpio(nuevo), id: `servicio-${numero}`, pausado: false };
  return {
    ok: true,
    valor: {
      servicio,
      datos: {
        ...datos,
        catalogo: [...datos.catalogo, servicio],
        correlativos: { ...datos.correlativos, servicio: numero },
      },
    },
  };
}

/** Editar no cambia las órdenes que ya existen: cada una guarda el precio que tenía. */
export function editarServicio(
  datos: DatosTaller,
  id: string,
  cambios: DatosServicio,
): Resultado<{ datos: DatosTaller; servicio: Servicio }> {
  const actual = datos.catalogo.find((s) => s.id === id);
  if (!actual) return { ok: false, error: "No existe ese servicio." };
  const error = validar(datos.catalogo, cambios, id);
  if (error) return { ok: false, error };
  const servicio: Servicio = { ...actual, ...limpio(cambios) };
  return {
    ok: true,
    valor: { servicio, datos: { ...datos, catalogo: datos.catalogo.map((s) => (s.id === id ? servicio : s)) } },
  };
}

export function cambiarPausa(
  datos: DatosTaller,
  id: string,
  pausado: boolean,
): Resultado<{ datos: DatosTaller; servicio: Servicio }> {
  const actual = datos.catalogo.find((s) => s.id === id);
  if (!actual) return { ok: false, error: "No existe ese servicio." };
  if (id === ID_DIAGNOSTICO && pausado) {
    return { ok: false, error: "El Diagnóstico general no se puede pausar: toda orden lo usa." };
  }
  const servicio: Servicio = { ...actual, pausado };
  return {
    ok: true,
    valor: { servicio, datos: { ...datos, catalogo: datos.catalogo.map((s) => (s.id === id ? servicio : s)) } },
  };
}

/** Órdenes abiertas (no Entregado ni Sin reparación) que tienen este servicio presupuestado. */
export function ordenesAbiertasCon(datos: DatosTaller, id: string): Orden[] {
  return datos.ordenes.filter((o) => !esFinal(o.estado) && o.servicios.some((s) => s.servicioId === id));
}

/** Solo se borra si ninguna orden abierta lo usa. Las órdenes cerradas conservan su línea. */
export function borrarServicio(
  datos: DatosTaller,
  id: string,
): Resultado<{ datos: DatosTaller; servicio: Servicio }> {
  const actual = datos.catalogo.find((s) => s.id === id);
  if (!actual) return { ok: false, error: "No existe ese servicio." };
  if (id === ID_DIAGNOSTICO) {
    return { ok: false, error: "El Diagnóstico general no se puede borrar: toda orden lo usa." };
  }
  const abiertas = ordenesAbiertasCon(datos, id);
  if (abiertas.length > 0) {
    const codigos = abiertas.map((o) => o.id).join(", ");
    return {
      ok: false,
      error: `No se puede borrar «${actual.nombre}»: está en ${abiertas.length === 1 ? "la orden abierta" : "las órdenes abiertas"} ${codigos}. Podés pausarlo para que no se ofrezca en órdenes nuevas.`,
    };
  }
  return {
    ok: true,
    valor: { servicio: actual, datos: { ...datos, catalogo: datos.catalogo.filter((s) => s.id !== id) } },
  };
}
