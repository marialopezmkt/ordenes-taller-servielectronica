// Puente entre las pantallas y los datos. Cada acción: se calcula con el dominio,
// se guarda el documento completo y recién entonces cambia lo que se ve.
// Si la validación o el guardado fallan, el estado queda igual.
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { hoyLocal } from "@/dominio/fechas";
import type { DatosTaller, Fecha, Resultado } from "@/dominio/modelo";
import { cargarDatos, guardarDatos, type Almacen } from "./almacen";

type Contexto = {
  datos: DatosTaller;
  hoy: Fecha;
  /** Aviso persistente si el navegador no deja guardar. */
  aviso?: string;
  ejecutar: <R extends { datos: DatosTaller }>(
    accion: (datos: DatosTaller, hoy: Fecha) => Resultado<R>,
  ) => Resultado<R>;
};

const DatosContext = createContext<Contexto | null>(null);

function almacenDelNavegador(): Almacen | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function DatosProvider({
  children,
  almacen = almacenDelNavegador(),
  hoy = hoyLocal(),
}: {
  children: ReactNode;
  almacen?: Almacen;
  hoy?: Fecha;
}) {
  const [carga] = useState(() => cargarDatos(almacen, hoy));
  const [datos, setDatos] = useState<DatosTaller | null>(carga.ok ? carga.valor.datos : null);
  const actuales = useRef(datos);

  if (!carga.ok || !datos) {
    return (
      <p role="alert" className="p-4">
        {carga.ok ? "No hay datos." : carga.error}
      </p>
    );
  }

  function ejecutar<R extends { datos: DatosTaller }>(
    accion: (datos: DatosTaller, hoy: Fecha) => Resultado<R>,
  ): Resultado<R> {
    const r = accion(actuales.current!, hoy);
    if (!r.ok) return r;
    if (!almacen) return { ok: false, error: "Este navegador no deja guardar datos." };
    const guardado = guardarDatos(almacen, r.valor.datos);
    if (!guardado.ok) return { ok: false, error: guardado.error };
    actuales.current = r.valor.datos;
    setDatos(r.valor.datos);
    return r;
  }

  return (
    <DatosContext.Provider value={{ datos, hoy, aviso: carga.valor.aviso, ejecutar }}>
      {children}
    </DatosContext.Provider>
  );
}

export function useDatos(): Contexto {
  const ctx = useContext(DatosContext);
  if (!ctx) throw new Error("useDatos va dentro de <DatosProvider>.");
  return ctx;
}
