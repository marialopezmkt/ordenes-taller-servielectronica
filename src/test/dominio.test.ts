import { describe, it, expect } from "vitest";
import {
  abrirOrden,
  aplicarAccion,
  cargarDiagnostico,
  crearEquipo,
  type NuevoEquipo,
} from "@/dominio/acciones";
import { diasEntre, sumarDias } from "@/dominio/fechas";
import { ESTADOS, TRANSICIONES, type DatosTaller, type IdAccion, type Resultado } from "@/dominio/modelo";
import {
  accionesDisponibles,
  desglose,
  filtrarOrdenes,
  retiroAtrasado,
} from "@/dominio/reglas";

const HOY = "2026-11-20";

function vacios(): DatosTaller {
  return { version: 1, equipos: [], ordenes: [], correlativos: { equipo: 0, ordenesPorAnio: {} } };
}

function notebook(serie: string): NuevoEquipo {
  return {
    tipo: "notebook",
    marca: "Lenovo",
    modelo: "IdeaPad 3",
    serie,
    accesorios: "Cargador",
    estadoFisico: "Bisagra floja",
    contacto: { nombre: "Cliente de prueba", telefono: "+56 9 0000 0000" },
  };
}

function ok<T>(r: Resultado<T>): T {
  if (!r.ok) throw new Error(r.error);
  return r.valor;
}

/** Equipo + orden llevada hasta Esperando aprobación con limpieza y un repuesto. */
function ordenEsperandoAprobacion(fecha = HOY) {
  let d = ok(crearEquipo(vacios(), notebook("SN-001"), fecha)).datos;
  const r = ok(abrirOrden(d, "EQ-0001", "Se apaga a los diez minutos", fecha));
  d = r.datos;
  const id = r.orden.id;
  d = ok(aplicarAccion(d, id, "iniciar_diagnostico", fecha)).datos;
  d = ok(
    cargarDiagnostico(d, id, {
      diagnostico: "Limpieza interna y pasta térmica",
      servicioIds: ["limpieza"],
      repuestos: [{ descripcion: "Pasta térmica", precio: 5000 }],
    }),
  ).datos;
  d = ok(aplicarAccion(d, id, "enviar_presupuesto", fecha)).datos;
  return { datos: d, id };
}

describe("criterio 1: serie o IMEI única", () => {
  it("no deja guardar una serie repetida y avisa cuál es la ficha existente", () => {
    const d = ok(crearEquipo(vacios(), notebook("ABC 123"), HOY)).datos;
    const r = crearEquipo(d, notebook("abc-123"), HOY);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.equipoExistenteId).toBe("EQ-0001");
    expect(r.error).toContain("EQ-0001");
  });

  it("si falla la validación no cambia los datos ni el correlativo", () => {
    const d = ok(crearEquipo(vacios(), notebook("X1"), HOY)).datos;
    crearEquipo(d, notebook("X1"), HOY);
    expect(d.equipos).toHaveLength(1);
    expect(d.correlativos.equipo).toBe(1);
  });
});

describe("criterio 2: una sola orden abierta por equipo", () => {
  it("no permite abrir otra mientras haya una abierta", () => {
    const d = ok(crearEquipo(vacios(), notebook("S1"), HOY)).datos;
    const d2 = ok(abrirOrden(d, "EQ-0001", "No enciende", HOY)).datos;
    const r = abrirOrden(d2, "EQ-0001", "Otra falla", HOY);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("OT-2026-001");
    expect(d2.correlativos.ordenesPorAnio["2026"]).toBe(1);
  });

  it("los códigos son correlativos y no se reutilizan", () => {
    let d = ok(crearEquipo(vacios(), notebook("S1"), HOY)).datos;
    d = ok(crearEquipo(d, notebook("S2"), HOY)).datos;
    expect(ok(abrirOrden(d, "EQ-0001", "a", HOY)).orden.id).toBe("OT-2026-001");
    d = ok(abrirOrden(d, "EQ-0001", "a", HOY)).datos;
    expect(ok(abrirOrden(d, "EQ-0002", "b", HOY)).orden.id).toBe("OT-2026-002");
  });
});

describe("criterio 3: aprobación y rechazo", () => {
  it("antes de decidir, el total suma diagnóstico, servicios y repuestos", () => {
    const { datos, id } = ordenEsperandoAprobacion();
    const orden = datos.ordenes.find((o) => o.id === id)!;
    expect(desglose(orden).total).toBe(10000 + 22000 + 5000);
  });

  it("si aprueba, el diagnóstico se descuenta del total", () => {
    const { datos, id } = ordenEsperandoAprobacion();
    const orden = ok(aplicarAccion(datos, id, "aprobar", HOY)).orden;
    const d = desglose(orden);
    expect(d.total).toBe(22000 + 5000);
    expect(d.lineas.some((l) => l.monto === -10000)).toBe(true);
  });

  it("si rechaza, el total queda en el precio del diagnóstico", () => {
    const { datos, id } = ordenEsperandoAprobacion();
    const orden = ok(aplicarAccion(datos, id, "rechazar", HOY)).orden;
    expect(desglose(orden).total).toBe(10000);
  });
});

describe("reto: cierre rechazado sin falsa reparación", () => {
  it("el rechazo pasa a Lista para retirar sin reparación ni repuestos consumidos", () => {
    const { datos, id } = ordenEsperandoAprobacion();
    const orden = ok(aplicarAccion(datos, id, "rechazar", HOY)).orden;
    expect(orden.estado).toBe("lista_para_retirar");
    expect(orden.presupuesto).toBe("rechazado");
    expect(orden.reparacionRealizada).toBe(false);
    expect(orden.repuestosConsumidos).toBe(false);
    expect(desglose(orden).lineas.some((l) => l.concepto.startsWith("Repuesto"))).toBe(false);
  });

  it("el rechazo se conserva al entregar y no da garantía", () => {
    const { datos, id } = ordenEsperandoAprobacion(sumarDias(HOY, -10));
    let d = ok(aplicarAccion(datos, id, "rechazar", sumarDias(HOY, -10))).datos;
    d = ok(aplicarAccion(d, id, "entregar", sumarDias(HOY, -9))).datos;
    const orden = d.ordenes.find((o) => o.id === id)!;
    expect(orden.presupuesto).toBe("rechazado");
    expect(orden.reparacionRealizada).toBe(false);
    expect(ok(abrirOrden(d, "EQ-0001", "Volvió a fallar", HOY)).orden.enGarantia).toBe(false);
  });

  it("solo la reparación terminada marca trabajo reparado y consume repuestos", () => {
    const { datos, id } = ordenEsperandoAprobacion();
    const d = ok(aplicarAccion(datos, id, "aprobar", HOY)).datos;
    const orden = ok(aplicarAccion(d, id, "terminar_reparacion", HOY)).orden;
    expect(orden.reparacionRealizada).toBe(true);
    expect(orden.repuestosConsumidos).toBe(true);
  });
});

describe("criterio 4: garantía de 90 días", () => {
  function entregadoHace(dias: number) {
    const fecha = sumarDias(HOY, -dias);
    const { datos, id } = ordenEsperandoAprobacion(fecha);
    let d = ok(aplicarAccion(datos, id, "aprobar", fecha)).datos;
    d = ok(aplicarAccion(d, id, "terminar_reparacion", fecha)).datos;
    return ok(aplicarAccion(d, id, "entregar", fecha)).datos;
  }

  it("entregado hace 90 días: la orden nueva va en garantía con mano de obra en cero", () => {
    let d = entregadoHace(90);
    const r = ok(abrirOrden(d, "EQ-0001", "Volvió a calentar", HOY));
    expect(r.orden.enGarantia).toBe(true);
    d = ok(aplicarAccion(r.datos, r.orden.id, "iniciar_diagnostico", HOY)).datos;
    const orden = ok(
      cargarDiagnostico(d, r.orden.id, {
        diagnostico: "Pasta térmica seca",
        servicioIds: ["limpieza"],
        repuestos: [{ descripcion: "Ventilador", precio: 12000 }],
      }),
    ).orden;
    // Mano de obra en cero; el repuesto se cobra.
    expect(desglose(orden).total).toBe(12000);
  });

  it("entregado hace 91 días: ya no hay garantía", () => {
    const d = entregadoHace(91);
    expect(ok(abrirOrden(d, "EQ-0001", "Falla", HOY)).orden.enGarantia).toBe(false);
  });
});

describe("criterio 5: retiro atrasado", () => {
  function listaHace(dias: number) {
    const fecha = sumarDias(HOY, -dias);
    const { datos, id } = ordenEsperandoAprobacion(fecha);
    return ok(aplicarAccion(datos, id, "rechazar", fecha)).orden;
  }

  it("más de 30 días en Lista para retirar muestra retiro atrasado", () => {
    expect(retiroAtrasado(listaHace(31), HOY)).toBe(true);
  });

  it("30 días justos todavía no", () => {
    expect(retiroAtrasado(listaHace(30), HOY)).toBe(false);
  });
});

describe("criterio 6: solo los pasos de la tabla", () => {
  it("los estados finales no ofrecen pasos", () => {
    expect(TRANSICIONES.entregado).toEqual([]);
    expect(TRANSICIONES.sin_reparacion).toEqual([]);
  });

  it("la tabla coincide con el briefing", () => {
    const destinos = Object.fromEntries(
      ESTADOS.map((e) => [e.id, TRANSICIONES[e.id].map((a) => a.destino)]),
    );
    expect(destinos).toEqual({
      ingresado: ["en_diagnostico"],
      en_diagnostico: ["esperando_aprobacion"],
      esperando_aprobacion: ["en_reparacion", "lista_para_retirar"],
      en_reparacion: ["esperando_repuesto", "lista_para_retirar"],
      esperando_repuesto: ["en_reparacion"],
      lista_para_retirar: ["entregado", "sin_reparacion"],
      entregado: [],
      sin_reparacion: [],
    });
  });

  it("un paso fuera de la tabla se rechaza sin cambiar la orden", () => {
    const { datos, id } = ordenEsperandoAprobacion();
    const pasos: IdAccion[] = ["entregar", "terminar_reparacion", "iniciar_diagnostico"];
    for (const paso of pasos) {
      expect(aplicarAccion(datos, id, paso, HOY).ok).toBe(false);
    }
    const orden = datos.ordenes.find((o) => o.id === id)!;
    expect(orden.estado).toBe("esperando_aprobacion");
    expect(accionesDisponibles(orden).map((a) => a.id)).toEqual(["aprobar", "rechazar"]);
  });

  it("no se pide aprobación sin diagnóstico cargado", () => {
    const d = ok(crearEquipo(vacios(), notebook("S1"), HOY)).datos;
    const r = ok(abrirOrden(d, "EQ-0001", "No enciende", HOY));
    const d2 = ok(aplicarAccion(r.datos, r.orden.id, "iniciar_diagnostico", HOY)).datos;
    expect(aplicarAccion(d2, r.orden.id, "enviar_presupuesto", HOY).ok).toBe(false);
  });
});

describe("criterio 7: filtros combinados", () => {
  it("estado, tipo y días se combinan", () => {
    let d = vacios();
    d = ok(crearEquipo(d, notebook("N1"), HOY)).datos;
    d = ok(crearEquipo(d, { ...notebook("C1"), tipo: "celular" }, HOY)).datos;
    d = ok(crearEquipo(d, notebook("N2"), HOY)).datos;
    d = ok(abrirOrden(d, "EQ-0001", "a", sumarDias(HOY, -2))).datos;
    d = ok(abrirOrden(d, "EQ-0002", "b", sumarDias(HOY, -2))).datos;
    d = ok(abrirOrden(d, "EQ-0003", "c", sumarDias(HOY, -40))).datos;

    const todos = { estado: "todos", tipo: "todos", dias: "todos" } as const;
    expect(filtrarOrdenes(d, todos, HOY)).toHaveLength(3);
    expect(filtrarOrdenes(d, { ...todos, tipo: "notebook" }, HOY)).toHaveLength(2);
    expect(filtrarOrdenes(d, { ...todos, tipo: "notebook", dias: "hasta7" }, HOY)).toHaveLength(1);
    expect(filtrarOrdenes(d, { estado: "ingresado", tipo: "notebook", dias: "mas30" }, HOY)).toHaveLength(1);
    expect(filtrarOrdenes(d, { estado: "en_reparacion", tipo: "todos", dias: "todos" }, HOY)).toHaveLength(0);
  });
});

describe("fechas", () => {
  it("cuenta días sin correrse por el huso horario", () => {
    expect(diasEntre("2026-02-27", "2026-03-01")).toBe(2);
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
  });
});
