import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useDatos } from "@/datos/contexto";
import { aplicarAccion } from "@/dominio/acciones";
import { TIPOS_EQUIPO, nombreEstado, type Accion } from "@/dominio/modelo";
import { accionesDisponibles, desglose, diasEnEstado, retiroAtrasado } from "@/dominio/reglas";
import { EstadoChip, Etiqueta } from "@/ui/EstadoChip";
import { FormDiagnostico } from "@/ui/FormDiagnostico";
import { estilos, formatoFecha, formatoPesos, haceDias } from "@/ui/formato";
import { Mensaje } from "@/ui/Marco";

const PRESUPUESTO = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado" };

export function DetalleOrden() {
  const { id } = useParams();
  const { datos, hoy, ejecutar } = useDatos();
  const inicial = (useLocation().state as { exito?: string } | null)?.exito;
  const [mensaje, setMensaje] = useState<{ tipo: "error" | "exito"; texto: string } | null>(
    inicial ? { tipo: "exito", texto: inicial } : null,
  );

  const orden = datos.ordenes.find((o) => o.id === id);
  const equipo = orden && datos.equipos.find((e) => e.id === orden.equipoId);
  if (!orden || !equipo) {
    return (
      <>
        <Mensaje tipo="error" texto={`No existe la orden ${id ?? ""}.`} />
        <Link to="/" className={`${estilos.enlace} mt-3 inline-block`}>
          Volver a la mesa
        </Link>
      </>
    );
  }

  const pasos = accionesDisponibles(orden);
  const cuenta = desglose(orden);
  const rechazada = orden.presupuesto === "rechazado";

  function avanzar(accion: Accion) {
    const r = ejecutar((d, h) => aplicarAccion(d, orden!.id, accion.id, h));
    setMensaje(
      r.ok
        ? { tipo: "exito", texto: `Guardado: la orden pasó a ${nombreEstado(accion.destino)}.` }
        : { tipo: "error", texto: r.error },
    );
  }

  return (
    <div className="grid gap-4">
      <section className={estilos.panel}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gris">Orden de trabajo</p>
            <h1 className="font-titulo text-4xl font-bold tracking-wide">{orden.id}</h1>
          </div>
          <EstadoChip estado={orden.estado} />
        </div>
        <p className="mt-1 text-sm">
          {nombreEstado(orden.estado)} desde {haceDias(diasEnEstado(orden, hoy))} · ingresó el{" "}
          {formatoFecha(orden.ingresadaEn)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {retiroAtrasado(orden, hoy) && <Etiqueta tono="naranja" texto="Retiro atrasado" />}
          {orden.enGarantia && <Etiqueta tono="verde" texto="En garantía" />}
        </div>
        <p className="mt-3">
          <Link to={`/equipos/${equipo.id}`} className={estilos.enlace}>
            {TIPOS_EQUIPO.find((t) => t.id === equipo.tipo)?.nombre} {equipo.marca} {equipo.modelo}
          </Link>{" "}
          <span className="text-sm text-gris">· Serie {equipo.serie}</span>
        </p>
        <dl className="mt-3 grid border-l border-t border-grafito/20 sm:grid-cols-3">
          {[
            ["Presupuesto", PRESUPUESTO[orden.presupuesto]],
            ["Trabajo reparado", orden.reparacionRealizada ? "Sí" : "No"],
            ["Repuestos consumidos", orden.repuestosConsumidos ? "Sí" : "No"],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-r border-grafito/20 px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gris">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {mensaje && <Mensaje tipo={mensaje.tipo} texto={mensaje.texto} />}

      <section className={estilos.panel} aria-labelledby="pasos">
        <h2 id="pasos" className="text-xl font-bold">
          Próximo paso
        </h2>
        {pasos.length === 0 ? (
          <p className="mt-2 text-gris">Orden cerrada: no hay más pasos.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {pasos.map((p) => (
              <button
                key={p.id}
                type="button"
                className={p.id === "rechazar" || p.id === "sin_arreglo" ? estilos.botonSecundario : estilos.boton}
                onClick={() => avanzar(p)}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={estilos.panel}>
        <h2 className="text-xl font-bold">Falla y diagnóstico</h2>
        <p className="mt-2">
          <span className="font-semibold">Falla:</span> {orden.falla}
        </p>
        {orden.estado === "en_diagnostico" ? (
          <FormDiagnostico orden={orden} equipo={equipo} />
        ) : (
          <p className="mt-1">
            <span className="font-semibold">Diagnóstico:</span> {orden.diagnostico || "Sin cargar todavía."}
          </p>
        )}
        {rechazada && orden.repuestos.length > 0 && (
          <p className="mt-2 text-sm text-gris">
            Repuestos presupuestados que no se usaron:{" "}
            {orden.repuestos.map((r) => r.descripcion).join(", ")}.
          </p>
        )}
      </section>

      <section className={estilos.panel}>
        <h2 className="text-xl font-bold">Total</h2>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {cuenta.lineas.map((l, i) => (
              <tr key={i} className="border-b border-grafito/10">
                <td className="py-1.5 pr-2">{l.concepto}</td>
                <td className="whitespace-nowrap py-1.5 text-right tabular-nums">{formatoPesos(l.monto)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="pt-2 text-left font-titulo text-lg">
                Total{rechazada ? " (solo diagnóstico)" : ""}
              </th>
              <td className="pt-2 text-right font-titulo text-lg font-bold tabular-nums" data-testid="total">
                {formatoPesos(cuenta.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className={estilos.panel}>
        <h2 className="text-xl font-bold">Historial</h2>
        <ol className="mt-2 grid gap-2">
          {[...orden.historial].reverse().map((h, i) => (
            <li key={i} className="flex flex-wrap gap-x-3 text-sm">
              <span className="tabular-nums text-gris">{formatoFecha(h.fecha)}</span>
              <span className="font-semibold">{nombreEstado(h.estado)}</span>
              <span>{h.nota}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
