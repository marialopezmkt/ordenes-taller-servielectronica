import { useState } from "react";
import { useDatos } from "@/datos/contexto";
import { crearServicio, editarServicio, type DatosServicio } from "@/dominio/catalogo";
import { ID_DIAGNOSTICO, TIPOS_EQUIPO, TODOS_LOS_TIPOS, type Servicio, type TipoEquipo } from "@/dominio/modelo";
import { estilos } from "./formato";
import { Mensaje, NotaDemo } from "./Marco";

/** Alta (sin `servicio`) o edición de un servicio. Los cuatro atributos son obligatorios. */
export function FormServicio({
  servicio,
  alTerminar,
  alCancelar,
}: {
  servicio?: Servicio;
  alTerminar: (mensaje: string) => void;
  alCancelar?: () => void;
}) {
  const { ejecutar } = useDatos();
  const esDiagnostico = servicio?.id === ID_DIAGNOSTICO;
  // El borrador queda en pantalla si la validación o el guardado fallan.
  const [nombre, setNombre] = useState(servicio?.nombre ?? "");
  const [equipos, setEquipos] = useState<TipoEquipo[]>(servicio?.equipos ?? []);
  const [precio, setPrecio] = useState(servicio ? String(servicio.precio) : "");
  const [dias, setDias] = useState(servicio ? String(servicio.dias) : "");
  const [error, setError] = useState("");
  const idCampo = servicio?.id ?? "nuevo";

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const datosServicio: DatosServicio = {
          nombre,
          equipos: esDiagnostico ? TODOS_LOS_TIPOS : equipos,
          precio: precio.trim() === "" ? NaN : Number(precio.replace(/\./g, "")),
          dias: dias.trim() === "" ? NaN : Number(dias),
        };
        const r = ejecutar((d) =>
          servicio ? editarServicio(d, servicio.id, datosServicio) : crearServicio(d, datosServicio),
        );
        if (!r.ok) return setError(r.error);
        alTerminar(servicio ? `Servicio «${r.valor.servicio.nombre}» actualizado.` : `Servicio «${r.valor.servicio.nombre}» agregado al catálogo.`);
      }}
    >
      <label className={estilos.etiqueta}>
        Nombre
        <input
          className={estilos.campo}
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setError("");
          }}
        />
      </label>

      <fieldset>
        <legend className={estilos.etiqueta}>Tipos de equipo</legend>
        {esDiagnostico && <p className="text-xs text-gris">El diagnóstico aplica a todos los equipos.</p>}
        <div className="mt-1 grid grid-cols-2 gap-1">
          {TIPOS_EQUIPO.map((t) => (
            <label
              key={t.id}
              className="flex min-h-11 items-center gap-3 rounded-md border border-grafito/15 px-3 has-disabled:opacity-60"
            >
              <input
                type="checkbox"
                className="size-5 accent-celeste"
                disabled={esDiagnostico}
                checked={esDiagnostico || equipos.includes(t.id)}
                onChange={(e) => {
                  setEquipos(e.target.checked ? [...equipos, t.id] : equipos.filter((x) => x !== t.id));
                  setError("");
                }}
              />
              {t.nombre}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className={estilos.etiqueta} htmlFor={`precio-${idCampo}`}>
          Precio (CLP, mano de obra)
          <input
            id={`precio-${idCampo}`}
            inputMode="numeric"
            className={estilos.campo}
            value={precio}
            onChange={(e) => {
              setPrecio(e.target.value);
              setError("");
            }}
          />
        </label>
        <label className={estilos.etiqueta} htmlFor={`dias-${idCampo}`}>
          Días de trabajo
          <input
            id={`dias-${idCampo}`}
            inputMode="numeric"
            className={estilos.campo}
            value={dias}
            onChange={(e) => {
              setDias(e.target.value);
              setError("");
            }}
          />
        </label>
      </div>

      {servicio && (
        <p className="text-xs text-gris">
          Un precio nuevo se aplica a las órdenes que se carguen desde ahora. Las órdenes que ya existen conservan
          el precio que tenían.
        </p>
      )}
      {error && <Mensaje tipo="error" texto={error} />}
      <NotaDemo />
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={estilos.boton}>
          {servicio ? "Guardar cambios" : "Agregar servicio"}
        </button>
        {alCancelar && (
          <button type="button" className={estilos.botonSecundario} onClick={alCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
