import { describe, it, expect } from "vitest";
import { abrirOrden, aplicarAccion, cargarDiagnostico } from "@/dominio/acciones";
import {
  borrarServicio,
  cambiarPausa,
  crearServicio,
  editarServicio,
  ordenesAbiertasCon,
  type DatosServicio,
} from "@/dominio/catalogo";
import { ID_DIAGNOSTICO, type DatosTaller, type Resultado } from "@/dominio/modelo";
import { desglose, ordenAbierta } from "@/dominio/reglas";
import { crearSemilla } from "@/datos/semilla";

const HOY = "2026-11-23";

function ok<T>(r: Resultado<T>): T {
  if (!r.ok) throw new Error(r.error);
  return r.valor;
}

const valido: DatosServicio = { nombre: "Cambio de teclado de notebook", equipos: ["notebook"], precio: 24000, dias: 2 };

/** Orden abierta del Galaxy A54 en la semilla: Esperando aprobación, con pin de carga a $20.000. */
function ordenA54(d: DatosTaller) {
  return ordenAbierta(d.ordenes, "EQ-0002")!;
}

describe("catálogo: alta con atributos obligatorios", () => {
  it("da de alta un servicio válido, activo y con id nuevo", () => {
    const d = crearSemilla(HOY);
    const r = ok(crearServicio(d, valido));
    expect(r.servicio).toMatchObject({ ...valido, pausado: false });
    expect(r.datos.catalogo).toHaveLength(d.catalogo.length + 1);
    expect(r.datos.catalogo.filter((s) => s.id === r.servicio.id)).toHaveLength(1);
  });

  it.each([
    ["nombre", { ...valido, nombre: "  " }, "Falta el nombre"],
    ["tipos de equipo", { ...valido, equipos: [] }, "al menos un tipo"],
    ["precio", { ...valido, precio: 0 }, "precio"],
    ["precio con decimales", { ...valido, precio: 1500.5 }, "precio"],
    ["días", { ...valido, dias: 0 }, "días"],
  ] as const)("sin %s no guarda y no cambia nada", (_campo, datosServicio, mensaje) => {
    const d = crearSemilla(HOY);
    const r = crearServicio(d, { ...datosServicio, equipos: [...datosServicio.equipos] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(mensaje);
    expect(d.catalogo).toHaveLength(10);
    expect(d.correlativos.servicio).toBe(0);
  });

  it("no acepta un nombre repetido", () => {
    const d = crearSemilla(HOY);
    const r = crearServicio(d, { ...valido, nombre: "cambio de batería de celular" });
    expect(r.ok).toBe(false);
  });
});

describe("catálogo: edición con precios congelados", () => {
  it("editar el precio no cambia las órdenes que ya existen; las nuevas usan el precio nuevo", () => {
    let d = crearSemilla(HOY);
    const antes = ordenA54(d);
    expect(antes.total).toBe(36000);
    d = ok(editarServicio(d, "pin_carga", { nombre: "Cambio de pin de carga de celular", equipos: ["celular"], precio: 23000, dias: 2 })).datos;
    expect(ordenA54(d).total).toBe(36000);
    expect(desglose(ordenA54(d)).total).toBe(36000);

    // Orden nueva sobre el iPhone (Ingresado): al cargarle el pin, toma $23.000.
    const iphone = ordenAbierta(d.ordenes, "EQ-0008")!;
    d = ok(aplicarAccion(d, iphone.id, "iniciar_diagnostico", HOY)).datos;
    const conPin = ok(cargarDiagnostico(d, iphone.id, { diagnostico: "Pin flojo", servicioIds: ["pin_carga"], repuestos: [] })).orden;
    expect(conPin.servicios[0].precio).toBe(23000);
  });

  it("el valor del diagnóstico se edita en el catálogo y solo afecta órdenes nuevas", () => {
    let d = crearSemilla(HOY);
    d = ok(editarServicio(d, ID_DIAGNOSTICO, { nombre: "Diagnóstico general", equipos: ["notebook", "pc", "celular", "tablet"], precio: 12000, dias: 1 })).datos;
    expect(ordenA54(d).precioDiagnostico).toBe(10000);
    // El Motorola no tiene orden abierta: la nueva toma el diagnóstico a $12.000 (en garantía va en cero).
    const nueva = ok(abrirOrden(d, "EQ-0004", "Falla", HOY)).orden;
    expect(nueva.precioDiagnostico).toBe(12000);
  });

  it("el Diagnóstico general tiene que aplicar a todos los tipos", () => {
    const d = crearSemilla(HOY);
    const r = editarServicio(d, ID_DIAGNOSTICO, { nombre: "Diagnóstico general", equipos: ["celular"], precio: 10000, dias: 1 });
    expect(r.ok).toBe(false);
  });
});

describe("catálogo: pausa", () => {
  it("un servicio pausado no se puede cargar en un diagnóstico nuevo; reactivado sí", () => {
    let d = crearSemilla(HOY);
    d = ok(cambiarPausa(d, "bateria_celular", true)).datos;
    const iphone = ordenAbierta(d.ordenes, "EQ-0008")!;
    d = ok(aplicarAccion(d, iphone.id, "iniciar_diagnostico", HOY)).datos;
    const carga = { diagnostico: "Batería gastada", servicioIds: ["bateria_celular"], repuestos: [] };
    const r = cargarDiagnostico(d, iphone.id, carga);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("pausado");
    d = ok(cambiarPausa(d, "bateria_celular", false)).datos;
    expect(cargarDiagnostico(d, iphone.id, carga).ok).toBe(true);
  });

  it("pausar no saca el servicio de las órdenes que ya lo tienen", () => {
    let d = crearSemilla(HOY);
    d = ok(cambiarPausa(d, "pin_carga", true)).datos;
    expect(ordenA54(d).servicios.map((s) => s.servicioId)).toContain("pin_carga");
    expect(ordenA54(d).total).toBe(36000);
  });

  it("el Diagnóstico general no se puede pausar", () => {
    expect(cambiarPausa(crearSemilla(HOY), ID_DIAGNOSTICO, true).ok).toBe(false);
  });
});

describe("catálogo: no se borra un servicio con órdenes abiertas", () => {
  it("bloquea el borrado y avisa en qué órdenes abiertas está", () => {
    const d = crearSemilla(HOY);
    const codigo = ordenA54(d).id;
    const r = borrarServicio(d, "pin_carga");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(codigo);
    expect(d.catalogo.some((s) => s.id === "pin_carga")).toBe(true);
  });

  it("permite borrar un servicio que solo está en órdenes cerradas, y esas órdenes conservan su línea", () => {
    const d = crearSemilla(HOY);
    expect(ordenesAbiertasCon(d, "recuperacion")).toHaveLength(0);
    const r = ok(borrarServicio(d, "recuperacion"));
    expect(r.datos.catalogo.some((s) => s.id === "recuperacion")).toBe(false);
    expect(r.datos.ordenes.some((o) => o.servicios.some((s) => s.servicioId === "recuperacion"))).toBe(true);
  });

  it("permite borrar un servicio nuevo que nadie usa", () => {
    const creado = ok(crearServicio(crearSemilla(HOY), valido));
    expect(borrarServicio(creado.datos, creado.servicio.id).ok).toBe(true);
  });

  it("el Diagnóstico general no se puede borrar", () => {
    expect(borrarServicio(crearSemilla(HOY), ID_DIAGNOSTICO).ok).toBe(false);
  });
});
