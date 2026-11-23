import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { crearEquipo } from "@/dominio/acciones";
import { ESTADOS, datosVacios } from "@/dominio/modelo";
import {
  desglose,
  entregaSinReparacion,
  esFinal,
  garantiaVigente,
  ordenAbierta,
  retiroAtrasado,
} from "@/dominio/reglas";
import { CLAVE_DATOS, cargarDatos, type Almacen } from "@/datos/almacen";
import { DatosProvider, useDatos } from "@/datos/contexto";
import { crearSemilla } from "@/datos/semilla";

const HOY = "2026-11-20";

function almacenFalso(inicial: Record<string, string> = {}) {
  const mapa = new Map(Object.entries(inicial));
  let fallaAlGuardar = false;
  const almacen: Almacen = {
    getItem: (k) => mapa.get(k) ?? null,
    setItem: (k, v) => {
      if (fallaAlGuardar) throw new Error("QuotaExceededError");
      mapa.set(k, v);
    },
  };
  return { almacen, mapa, romper: () => (fallaAlGuardar = true) };
}

const nuevo = {
  tipo: "celular" as const,
  marca: "Nokia",
  modelo: "G21",
  serie: "NUEVA-001",
  accesorios: "",
  estadoFisico: "Bueno",
  contacto: { nombre: "Cliente de prueba", telefono: "" },
};

describe("semilla", () => {
  const d = crearSemilla(HOY);
  const orden = (equipoId: string) => d.ordenes.find((o) => o.equipoId === equipoId)!;

  it("trae 14 equipos de los cuatro tipos y 18 órdenes con códigos correlativos", () => {
    expect(d.equipos).toHaveLength(14);
    expect(new Set(d.equipos.map((e) => e.tipo))).toEqual(new Set(["notebook", "pc", "celular", "tablet"]));
    expect(d.ordenes).toHaveLength(18);
    expect(new Set(d.ordenes.map((o) => o.id)).size).toBe(18);
  });

  it("tiene órdenes en los ocho estados", () => {
    const cuenta = Object.fromEntries(ESTADOS.map((e) => [e.id, d.ordenes.filter((o) => o.estado === e.id).length]));
    expect(cuenta).toEqual({
      ingresado: 2,
      en_diagnostico: 2,
      esperando_aprobacion: 2,
      en_reparacion: 2,
      esperando_repuesto: 2,
      lista_para_retirar: 3,
      entregado: 3,
      sin_reparacion: 2,
    });
  });

  it("ningún equipo tiene más de una orden abierta y todas guardan su total", () => {
    for (const e of d.equipos) {
      expect(d.ordenes.filter((o) => o.equipoId === e.id && !esFinal(o.estado)).length).toBeLessThanOrEqual(1);
    }
    for (const o of d.ordenes) expect(o.total).toBe(desglose(o).total);
  });

  it("cubre los casos de los criterios", () => {
    const abierta = (id: string) => ordenAbierta(d.ordenes, id)!;
    expect(abierta("EQ-0002").estado).toBe("esperando_aprobacion");
    expect(retiroAtrasado(abierta("EQ-0003"), HOY)).toBe(true);
    expect(garantiaVigente(d.ordenes, "EQ-0004", HOY)).toBeDefined();
    expect(garantiaVigente(d.ordenes, "EQ-0007", HOY)).toBeUndefined();
    expect(abierta("EQ-0005")).toBeDefined();
    expect(orden("EQ-0010").estado).toBe("sin_reparacion");
    // Rechazó y retiró: esa entrega no da garantía.
    expect(entregaSinReparacion(d.ordenes, "EQ-0012", HOY)).toBeDefined();
    // Solo la HP lleva más de 30 días lista para retirar.
    expect(d.ordenes.filter((o) => retiroAtrasado(o, HOY))).toHaveLength(1);
  });

  it("se puede armar cualquier día del año (fechas relativas)", () => {
    expect(() => crearSemilla("2027-01-03")).not.toThrow();
    expect(() => crearSemilla("2026-03-01")).not.toThrow();
  });
});

describe("cargarDatos", () => {
  it("sin la clave propia carga la semilla y la guarda", () => {
    const { almacen, mapa } = almacenFalso();
    const r = cargarDatos(almacen, HOY);
    expect(r.ok && r.valor.datos.equipos).toHaveLength(14);
    expect(mapa.has(CLAVE_DATOS)).toBe(true);
  });

  it("los datos de la versión anterior (otra clave) no impiden cargar la semilla nueva", () => {
    const { almacen } = almacenFalso({ "servielectronica-ot:datos": JSON.stringify({ version: 1 }) });
    const r = cargarDatos(almacen, HOY);
    expect(r.ok && r.valor.datos.ordenes).toHaveLength(18);
  });

  it("con la clave propia no vuelve a cargar la semilla", () => {
    const guardado = datosVacios();
    const { almacen } = almacenFalso({ [CLAVE_DATOS]: JSON.stringify(guardado) });
    const r = cargarDatos(almacen, HOY);
    expect(r.ok && r.valor.datos.equipos).toHaveLength(0);
  });

  it("si lo guardado está dañado avisa y no lo pisa", () => {
    const { almacen, mapa } = almacenFalso({ [CLAVE_DATOS]: "{roto" });
    expect(cargarDatos(almacen, HOY).ok).toBe(false);
    expect(mapa.get(CLAVE_DATOS)).toBe("{roto");
  });
});

describe("guardar antes de mostrar éxito", () => {
  function montar(almacen: Almacen) {
    let ctx!: ReturnType<typeof useDatos>;
    function Espia() {
      ctx = useDatos();
      return <p>equipos: {ctx.datos.equipos.length}</p>;
    }
    render(
      <DatosProvider almacen={almacen} hoy={HOY}>
        <Espia />
      </DatosProvider>,
    );
    return () => ctx;
  }

  it("una acción válida se guarda completa y se ve", () => {
    const { almacen, mapa } = almacenFalso();
    const ctx = montar(almacen);
    let ok = false;
    act(() => {
      ok = ctx().ejecutar((d, hoy) => crearEquipo(d, nuevo, hoy)).ok;
    });
    expect(ok).toBe(true);
    expect(screen.getByText("equipos: 15")).toBeInTheDocument();
    expect(JSON.parse(mapa.get(CLAVE_DATOS)!).equipos).toHaveLength(15);
  });

  it("si el guardado falla, no cambia nada y devuelve el error", () => {
    const { almacen, mapa, romper } = almacenFalso();
    const ctx = montar(almacen);
    const antes = mapa.get(CLAVE_DATOS);
    romper();
    let r!: ReturnType<ReturnType<typeof useDatos>["ejecutar"]>;
    act(() => {
      r = ctx().ejecutar((d, hoy) => crearEquipo(d, nuevo, hoy));
    });
    expect(r.ok).toBe(false);
    expect(screen.getByText("equipos: 14")).toBeInTheDocument();
    expect(ctx().datos.correlativos.equipo).toBe(14);
    expect(mapa.get(CLAVE_DATOS)).toBe(antes);
  });

  it("los datos siguen ahí al recargar", () => {
    const { almacen } = almacenFalso();
    const ctx = montar(almacen);
    act(() => {
      ctx().ejecutar((d, hoy) => crearEquipo(d, nuevo, hoy));
    });
    const recargado = cargarDatos(almacen, HOY);
    expect(recargado.ok && recargado.valor.datos.equipos.some((e) => e.serie === "NUEVA-001")).toBe(true);
  });
});
