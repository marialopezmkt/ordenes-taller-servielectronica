import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDatos } from "@/datos/contexto";
import { abrirOrden } from "@/dominio/acciones";
import { sumarDias } from "@/dominio/fechas";
import { DIAS_GARANTIA, TIPOS_EQUIPO } from "@/dominio/modelo";
import { garantiaVigente, ordenAbierta } from "@/dominio/reglas";
import { EstadoChip, Etiqueta } from "@/ui/EstadoChip";
import { estilos, formatoFecha } from "@/ui/formato";
import { Mensaje, NotaDemo } from "@/ui/Marco";

export function FichaEquipo() {
  const { id } = useParams();
  const { datos, hoy, ejecutar } = useDatos();
  const navigate = useNavigate();
  const exito = (useLocation().state as { exito?: string } | null)?.exito;
  const [falla, setFalla] = useState("");
  const [error, setError] = useState("");

  const equipo = datos.equipos.find((e) => e.id === id);
  if (!equipo) {
    return (
      <>
        <Mensaje tipo="error" texto={`No existe el equipo ${id ?? ""}.`} />
        <Link to="/" className={`${estilos.enlace} mt-3 inline-block`}>
          Volver a la mesa
        </Link>
      </>
    );
  }
  const ordenes = datos.ordenes.filter((o) => o.equipoId === equipo.id).reverse();
  const abierta = ordenAbierta(datos.ordenes, equipo.id);
  const garantia = garantiaVigente(datos.ordenes, equipo.id, hoy);

  const casillas: [string, string][] = [
    ["Tipo", TIPOS_EQUIPO.find((t) => t.id === equipo.tipo)?.nombre ?? equipo.tipo],
    ["Marca y modelo", `${equipo.marca} ${equipo.modelo}`],
    ["Serie / IMEI", equipo.serie],
    ["Accesorios", equipo.accesorios || "Sin accesorios"],
    ["Estado físico", equipo.estadoFisico || "Sin observaciones"],
    ["Lo dejó", `${equipo.contacto.nombre}${equipo.contacto.telefono ? ` · ${equipo.contacto.telefono}` : ""}`],
    ["Primer ingreso", formatoFecha(equipo.ingresadoEn)],
  ];

  return (
    <div className="grid gap-4">
      {exito && <Mensaje tipo="exito" texto={exito} />}
      <section className={estilos.panel}>
        <p className="text-sm font-semibold text-gris">Ficha del equipo</p>
        <h1 className="font-titulo text-3xl font-bold tracking-wide">{equipo.id}</h1>
        <dl className="mt-3 grid border-l border-t border-grafito/20 sm:grid-cols-2">
          {casillas.map(([k, v]) => (
            <div key={k} className="border-b border-r border-grafito/20 px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gris">{k}</dt>
              <dd className="break-words font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3">
          {garantia ? (
            <>
              <Etiqueta tono="verde" texto="En garantía" /> Entregado el {formatoFecha(garantia.entregadoEn)} (
              {garantia.orden.id}). Cubre hasta el {formatoFecha(sumarDias(garantia.entregadoEn, DIAS_GARANTIA))}:
              quedan {garantia.diasRestantes} días.
            </>
          ) : (
            <span className="text-gris">Sin garantía vigente.</span>
          )}
        </p>
      </section>

      <section className={estilos.panel}>
        <h2 className="text-xl font-bold">Abrir orden</h2>
        {abierta ? (
          <p className="mt-2" role="note">
            Este equipo ya tiene la orden{" "}
            <Link to={`/ordenes/${abierta.id}`} className={estilos.enlace}>
              {abierta.id}
            </Link>{" "}
            abierta. Hasta que se entregue o se cierre sin reparación, no se puede abrir otra.
          </p>
        ) : (
          <form
            className="mt-2 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const r = ejecutar((d, h) => abrirOrden(d, equipo.id, falla, h));
              if (!r.ok) return setError(r.error);
              navigate(`/ordenes/${r.valor.orden.id}`, { state: { exito: `Orden ${r.valor.orden.id} abierta.` } });
            }}
          >
            {garantia && (
              <p className="rounded-md border-2 border-verde bg-verde/10 px-3 py-2 font-semibold">
                La orden nueva entra en garantía: la mano de obra va en CLP $0. Los repuestos se cobran.
              </p>
            )}
            <label className={estilos.etiqueta}>
              Qué falla
              <textarea
                rows={3}
                className={estilos.campo}
                value={falla}
                onChange={(e) => {
                  setFalla(e.target.value);
                  setError("");
                }}
              />
            </label>
            {error && <Mensaje tipo="error" texto={error} />}
            <NotaDemo />
            <button type="submit" className={`${estilos.boton} justify-self-start`}>
              Abrir orden
            </button>
          </form>
        )}
      </section>

      <section className={estilos.panel}>
        <h2 className="text-xl font-bold">Historial del equipo</h2>
        {ordenes.length === 0 ? (
          <p className="mt-2 text-gris">Todavía no tiene órdenes.</p>
        ) : (
          <ul className="mt-2 divide-y divide-grafito/15">
            {ordenes.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link to={`/ordenes/${o.id}`} className={`${estilos.enlace} font-titulo text-lg`}>
                  {o.id}
                </Link>
                <span className="text-sm text-gris">Ingresó el {formatoFecha(o.ingresadaEn)}</span>
                <EstadoChip estado={o.estado} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
