import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { crearEquipo } from "@/dominio/acciones";
import { garantiaVigente, ordenAbierta, retiroAtrasado } from "@/dominio/reglas";
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

  it("trae 10 equipos y 10 órdenes con códigos correlativos", () => {
    expect(d.equipos).toHaveLength(10);
    expect(d.ordenes).toHaveLength(10);
    expect(new Set(d.ordenes.map((o) => o.id)).size).toBe(10);
  });

  it("cubre los casos de los criterios", () => {
    expect(orden("EQ-0002").estado).toBe("esperando_aprobacion");
    expect(retiroAtrasado(orden("EQ-0003"), HOY)).toBe(true);
    expect(garantiaVigente(d.ordenes, "EQ-0004", HOY)).toBeDefined();
    expect(garantiaVigente(d.ordenes, "EQ-0007", HOY)).toBeUndefined();
    expect(ordenAbierta(d.ordenes, "EQ-0005")).toBeDefined();
    expect(orden("EQ-0010").estado).toBe("sin_reparacion");
  });

  it("se puede armar cualquier día del año (fechas relativas)", () => {
    expect(() => crearSemilla("2027-01-03")).not.toThrow();
  });
});

describe("cargarDatos", () => {
  it("sin la clave propia carga la semilla y la guarda", () => {
    const { almacen, mapa } = almacenFalso();
    const r = cargarDatos(almacen, HOY);
    expect(r.ok && r.valor.datos.equipos).toHaveLength(10);
    expect(mapa.has(CLAVE_DATOS)).toBe(true);
  });

  it("con la clave propia no vuelve a cargar la semilla", () => {
    const guardado = { version: 1, equipos: [], ordenes: [], correlativos: { equipo: 0, ordenesPorAnio: {} } };
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
    expect(screen.getByText("equipos: 11")).toBeInTheDocument();
    expect(JSON.parse(mapa.get(CLAVE_DATOS)!).equipos).toHaveLength(11);
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
    expect(screen.getByText("equipos: 10")).toBeInTheDocument();
    expect(ctx().datos.correlativos.equipo).toBe(10);
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
