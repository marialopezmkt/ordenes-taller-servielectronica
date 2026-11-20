import { useState } from "react";
import { useDatos } from "@/datos/contexto";
import { cargarDiagnostico } from "@/dominio/acciones";
import { CATALOGO, ID_DIAGNOSTICO, type Equipo, type Orden } from "@/dominio/modelo";
import { estilos, formatoPesos } from "./formato";
import { Mensaje, NotaDemo } from "./Marco";

type RepuestoBorrador = { descripcion: string; precio: string };

/** Carga del diagnóstico y del presupuesto: solo con la orden En diagnóstico. */
export function FormDiagnostico({ orden, equipo }: { orden: Orden; equipo: Equipo }) {
  const { ejecutar } = useDatos();
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico);
  const [servicios, setServicios] = useState(orden.servicios.map((s) => s.servicioId));
  const [repuestos, setRepuestos] = useState<RepuestoBorrador[]>(
    orden.repuestos.map((r) => ({ descripcion: r.descripcion, precio: String(r.precio) })),
  );
  const [mensaje, setMensaje] = useState<{ tipo: "error" | "exito"; texto: string } | null>(null);
  const aplicables = CATALOGO.filter((s) => s.id !== ID_DIAGNOSTICO && s.equipos.includes(equipo.tipo));

  function cambiarRepuesto(i: number, cambio: Partial<RepuestoBorrador>) {
    setRepuestos(repuestos.map((r, j) => (j === i ? { ...r, ...cambio } : r)));
    setMensaje(null);
  }

  return (
    <form
      className="mt-2 grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const r = ejecutar((d) =>
          cargarDiagnostico(d, orden.id, {
            diagnostico,
            servicioIds: servicios,
            repuestos: repuestos.map((x) => ({
              descripcion: x.descripcion,
              precio: x.precio.trim() === "" ? NaN : Number(x.precio.replace(/\./g, "")),
            })),
          }),
        );
        setMensaje(r.ok ? { tipo: "exito", texto: "Diagnóstico guardado." } : { tipo: "error", texto: r.error });
      }}
    >
      <label className={estilos.etiqueta}>
        Diagnóstico
        <textarea
          rows={3}
          className={estilos.campo}
          value={diagnostico}
          onChange={(e) => {
            setDiagnostico(e.target.value);
            setMensaje(null);
          }}
        />
      </label>

      <fieldset>
        <legend className={estilos.etiqueta}>Servicios a presupuestar (mano de obra)</legend>
        <div className="mt-1 grid gap-1">
          {aplicables.map((s) => (
            <label key={s.id} className="flex min-h-11 items-center gap-3 rounded-md border border-grafito/15 px-3">
              <input
                type="checkbox"
                className="size-5 accent-celeste"
                checked={servicios.includes(s.id)}
                onChange={(e) => {
                  setServicios(e.target.checked ? [...servicios, s.id] : servicios.filter((x) => x !== s.id));
                  setMensaje(null);
                }}
              />
              <span className="flex-1">{s.nombre}</span>
              <span className="whitespace-nowrap text-sm tabular-nums text-gris">
                {formatoPesos(s.precio)} · {s.dias} {s.dias === 1 ? "día" : "días"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={estilos.etiqueta}>Repuestos (precio libre)</legend>
        <div className="mt-1 grid gap-2">
          {repuestos.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_7rem_auto] items-end gap-2">
              <label className="text-xs font-semibold">
                Repuesto
                <input
                  className={estilos.campo}
                  value={r.descripcion}
                  onChange={(e) => cambiarRepuesto(i, { descripcion: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold">
                Precio CLP
                <input
                  inputMode="numeric"
                  className={estilos.campo}
                  value={r.precio}
                  onChange={(e) => cambiarRepuesto(i, { precio: e.target.value })}
                />
              </label>
              <button
                type="button"
                className={estilos.botonSecundario}
                aria-label={`Quitar repuesto ${i + 1}`}
                onClick={() => setRepuestos(repuestos.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className={`${estilos.botonSecundario} justify-self-start`}
            onClick={() => setRepuestos([...repuestos, { descripcion: "", precio: "" }])}
          >
            Agregar repuesto
          </button>
        </div>
      </fieldset>

      {mensaje && <Mensaje tipo={mensaje.tipo} texto={mensaje.texto} />}
      {!mensaje && <NotaDemo />}
      <button type="submit" className={`${estilos.boton} justify-self-start`}>
        Guardar diagnóstico
      </button>
    </form>
  );
}
