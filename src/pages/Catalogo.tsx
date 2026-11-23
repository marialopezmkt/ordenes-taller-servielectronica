import { useState } from "react";
import { useDatos } from "@/datos/contexto";
import { borrarServicio, cambiarPausa, ordenesAbiertasCon } from "@/dominio/catalogo";
import { ID_DIAGNOSTICO, TIPOS_EQUIPO, type Servicio } from "@/dominio/modelo";
import { estilos, formatoPesos } from "@/ui/formato";
import { FormServicio } from "@/ui/FormServicio";
import { Mensaje } from "@/ui/Marco";

type Aviso = { tipo: "error" | "exito"; texto: string } | null;

export function Catalogo() {
  const { datos } = useDatos();
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const activos = datos.catalogo.filter((s) => !s.pausado).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="text-sm text-gris">
            {datos.catalogo.length} servicios · {activos} activos · precios de mano de obra en CLP
          </p>
        </div>
        {!creando && (
          <button
            type="button"
            className={estilos.boton}
            onClick={() => {
              setCreando(true);
              setAviso(null);
            }}
          >
            Nuevo servicio
          </button>
        )}
      </div>

      {aviso && <Mensaje tipo={aviso.tipo} texto={aviso.texto} />}

      {creando && (
        <section className={estilos.panel} aria-labelledby="titulo-nuevo">
          <h2 id="titulo-nuevo" className="mb-2 text-xl font-bold">
            Nuevo servicio
          </h2>
          <FormServicio
            alTerminar={(texto) => {
              setCreando(false);
              setAviso({ tipo: "exito", texto });
            }}
            alCancelar={() => setCreando(false)}
          />
        </section>
      )}

      <ul className="grid gap-2 md:grid-cols-2" aria-label="Servicios">
        {datos.catalogo.map((s) => (
          <TarjetaServicio key={s.id} servicio={s} avisar={setAviso} />
        ))}
      </ul>
    </div>
  );
}

function TarjetaServicio({ servicio, avisar }: { servicio: Servicio; avisar: (a: Aviso) => void }) {
  const { datos, ejecutar } = useDatos();
  const [editando, setEditando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  // Los avisos de esta tarjeta se muestran dentro de ella, a la vista de quien tocó el botón.
  const [mensaje, setMensaje] = useState<Aviso>(null);
  const esDiagnostico = servicio.id === ID_DIAGNOSTICO;
  const abiertas = ordenesAbiertasCon(datos, servicio.id);
  const tipos = servicio.equipos.map((t) => TIPOS_EQUIPO.find((x) => x.id === t)?.nombre).join(", ");

  if (editando) {
    return (
      <li className={estilos.panel} aria-label={servicio.nombre}>
        <h2 className="mb-2 text-lg font-bold">Editar servicio</h2>
        <FormServicio
          servicio={servicio}
          alTerminar={(texto) => {
            setEditando(false);
            setMensaje({ tipo: "exito", texto });
          }}
          alCancelar={() => setEditando(false)}
        />
      </li>
    );
  }

  return (
    <li
      className={`rounded-lg border-2 bg-blanco p-3 ${servicio.pausado ? "border-dashed border-gris/60" : "border-grafito/15"}`}
      aria-label={servicio.nombre}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className={`font-titulo text-lg font-bold ${servicio.pausado ? "text-gris" : ""}`}>{servicio.nombre}</h2>
        <span
          className={`whitespace-nowrap rounded-full border-2 px-2.5 py-0.5 text-sm font-semibold ${
            servicio.pausado ? "border-gris bg-fondo text-grafito" : "border-verde bg-verde/15 text-grafito"
          }`}
        >
          {servicio.pausado ? "Pausado" : "Activo"}
        </span>
      </div>
      <p className="mt-1 text-sm">{tipos}</p>
      <p className="mt-1 font-semibold tabular-nums">
        {formatoPesos(servicio.precio)} · {servicio.dias} {servicio.dias === 1 ? "día" : "días"}
      </p>
      <p className="mt-1 text-sm text-gris">
        {esDiagnostico
          ? "Se cobra en toda orden. No se puede pausar ni borrar."
          : abiertas.length > 0
            ? (
                <>
                  En {abiertas.length === 1 ? "1 orden abierta" : `${abiertas.length} órdenes abiertas`}:{" "}
                  {abiertas.map((o, i) => (
                    <span key={o.id} className="whitespace-nowrap">
                      {o.id}
                      {i < abiertas.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </>
              )
            : servicio.pausado
              ? "No se ofrece en diagnósticos nuevos."
              : "Sin órdenes abiertas."}
      </p>
      {mensaje && (
        <div className="mt-3">
          <Mensaje tipo={mensaje.tipo} texto={mensaje.texto} />
        </div>
      )}

      {confirmarBorrado ? (
        <div className="mt-3 grid gap-2 rounded-md border-2 border-naranja bg-naranja/10 p-3" role="group" aria-label="Confirmar borrado">
          <p className="font-semibold">¿Borrar «{servicio.nombre}» del catálogo?</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={estilos.boton}
              onClick={() => {
                const r = ejecutar((d) => borrarServicio(d, servicio.id));
                setConfirmarBorrado(false);
                // Si se borró, la tarjeta desaparece: el aviso va arriba de la lista.
                if (r.ok) avisar({ tipo: "exito", texto: `Servicio «${servicio.nombre}» borrado del catálogo.` });
                else setMensaje({ tipo: "error", texto: r.error });
              }}
            >
              Sí, borrar
            </button>
            <button type="button" className={estilos.botonSecundario} onClick={() => setConfirmarBorrado(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={estilos.botonSecundario}
            onClick={() => {
              setEditando(true);
              setMensaje(null);
              avisar(null);
            }}
          >
            Editar
          </button>
          {!esDiagnostico && (
            <>
              <button
                type="button"
                className={estilos.botonSecundario}
                onClick={() => {
                  const r = ejecutar((d) => cambiarPausa(d, servicio.id, !servicio.pausado));
                  setMensaje(
                    r.ok
                      ? {
                          tipo: "exito",
                          texto: servicio.pausado
                            ? `«${servicio.nombre}» está activo otra vez.`
                            : `«${servicio.nombre}» quedó pausado: no se ofrece en diagnósticos nuevos.`,
                        }
                      : { tipo: "error", texto: r.error },
                  );
                }}
              >
                {servicio.pausado ? "Reactivar" : "Pausar"}
              </button>
              <button
                type="button"
                className={estilos.botonSecundario}
                onClick={() => {
                  avisar(null);
                  setMensaje(null);
                  if (abiertas.length > 0) {
                    // Misma regla que el dominio: se avisa sin pedir confirmación.
                    const r = borrarServicio(datos, servicio.id);
                    if (!r.ok) setMensaje({ tipo: "error", texto: r.error });
                    return;
                  }
                  setConfirmarBorrado(true);
                }}
              >
                Borrar
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
