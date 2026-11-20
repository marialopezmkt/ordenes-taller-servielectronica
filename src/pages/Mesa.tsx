import { useState } from "react";
import { Link } from "react-router-dom";
import { useDatos } from "@/datos/contexto";
import { ESTADOS, TIPOS_EQUIPO, nombreEstado, type Orden } from "@/dominio/modelo";
import {
  FILTROS_DIAS,
  antiguedad,
  diasEnEstado,
  esFinal,
  filtrarOrdenes,
  retiroAtrasado,
  type Filtros,
} from "@/dominio/reglas";
import { EstadoChip, Etiqueta } from "@/ui/EstadoChip";
import { estilos, haceDias } from "@/ui/formato";

const SIN_FILTROS: Filtros = { estado: "todos", tipo: "todos", dias: "todos" };

export function Mesa() {
  const { datos, hoy } = useDatos();
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);
  // Primero lo abierto y, dentro, lo más viejo: es lo que más urge en la mesa.
  // Las órdenes cerradas van al final.
  const lista = filtrarOrdenes(datos, filtros, hoy).sort(
    (a, b) =>
      Number(esFinal(a.estado)) - Number(esFinal(b.estado)) ||
      a.ingresadaEn.localeCompare(b.ingresadaEn) ||
      a.id.localeCompare(b.id),
  );
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Mesa</h1>
          <p className="text-sm text-gris">Órdenes en el taller</p>
        </div>
        <Link to="/equipos/nuevo" className={estilos.boton}>
          Registrar equipo
        </Link>
      </div>

      <form className={`${estilos.panel} mt-3 grid gap-3 sm:grid-cols-3`} onSubmit={(e) => e.preventDefault()}>
        <label className={estilos.etiqueta}>
          Estado
          <select
            className={estilos.campo}
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as Filtros["estado"] })}
          >
            <option value="todos">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className={estilos.etiqueta}>
          Tipo de equipo
          <select
            className={estilos.campo}
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value as Filtros["tipo"] })}
          >
            <option value="todos">Todos los tipos</option>
            {TIPOS_EQUIPO.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className={estilos.etiqueta}>
          Días desde el ingreso
          <select
            className={estilos.campo}
            value={filtros.dias}
            onChange={(e) => setFiltros({ ...filtros, dias: e.target.value as Filtros["dias"] })}
          >
            {FILTROS_DIAS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </label>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="font-semibold" data-testid="contador">
          {lista.length === 1 ? "1 orden" : `${lista.length} órdenes`}
        </p>
        {hayFiltros && (
          <button type="button" className={estilos.botonSecundario} onClick={() => setFiltros(SIN_FILTROS)}>
            Quitar filtros
          </button>
        )}
      </div>

      {lista.length === 0 ? (
        <p className={`${estilos.panel} mt-3 text-gris`}>Ninguna orden coincide con estos filtros.</p>
      ) : (
        <ul className="mt-3 grid gap-2 md:grid-cols-2" aria-label="Órdenes">
          {lista.map((o) => (
            <TarjetaOrden key={o.id} orden={o} />
          ))}
        </ul>
      )}
    </>
  );
}

function TarjetaOrden({ orden }: { orden: Orden }) {
  const { datos, hoy } = useDatos();
  const equipo = datos.equipos.find((e) => e.id === orden.equipoId);
  const atrasado = retiroAtrasado(orden, hoy);
  const enEstado = diasEnEstado(orden, hoy);

  return (
    <li>
      <Link
        to={`/ordenes/${orden.id}`}
        className={`block rounded-lg border-2 bg-blanco p-3 hover:border-celeste ${
          atrasado ? "border-naranja" : "border-grafito/15"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="font-titulo text-2xl font-bold tracking-wide">{orden.id}</span>
          <EstadoChip estado={orden.estado} />
        </div>
        <p className="mt-1 font-semibold">
          {equipo ? `${TIPOS_EQUIPO.find((t) => t.id === equipo.tipo)?.nombre} ${equipo.marca} ${equipo.modelo}` : "—"}
        </p>
        <p className="text-sm text-gris">{orden.falla}</p>
        <p className="mt-2 text-sm">
          {nombreEstado(orden.estado)} desde {haceDias(enEstado)} · ingresó {haceDias(antiguedad(orden, hoy))}
        </p>
        {(atrasado || orden.enGarantia) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {atrasado && <Etiqueta tono="naranja" texto="Retiro atrasado" />}
            {orden.enGarantia && <Etiqueta tono="verde" texto="En garantía" />}
          </div>
        )}
      </Link>
    </li>
  );
}
