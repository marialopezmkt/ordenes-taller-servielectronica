import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDatos } from "@/datos/contexto";
import { crearEquipo, type NuevoEquipo } from "@/dominio/acciones";
import { TIPOS_EQUIPO } from "@/dominio/modelo";
import { estilos } from "@/ui/formato";
import { Mensaje, NotaDemo } from "@/ui/Marco";

const VACIO: NuevoEquipo = {
  tipo: "notebook",
  marca: "",
  modelo: "",
  serie: "",
  accesorios: "",
  estadoFisico: "",
  contacto: { nombre: "", telefono: "" },
};

export function AltaEquipo() {
  const { ejecutar } = useDatos();
  const navigate = useNavigate();
  // El borrador queda en pantalla si la validación o el guardado fallan.
  const [form, setForm] = useState<NuevoEquipo>(VACIO);
  const [error, setError] = useState<{ texto: string; equipoId?: string } | null>(null);

  function campo(nombre: "marca" | "modelo" | "serie" | "accesorios" | "estadoFisico", etiqueta: string, ayuda?: string) {
    return (
      <label className={estilos.etiqueta}>
        {etiqueta}
        {ayuda && <span className="block text-xs font-normal text-gris">{ayuda}</span>}
        <input
          className={estilos.campo}
          value={form[nombre]}
          onChange={(e) => setForm({ ...form, [nombre]: e.target.value })}
        />
      </label>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Registrar equipo</h1>
      <form
        className={`${estilos.panel} mt-3 grid gap-4 sm:grid-cols-2`}
        onSubmit={(e) => {
          e.preventDefault();
          const r = ejecutar((d, hoy) => crearEquipo(d, form, hoy));
          if (!r.ok) {
            setError({ texto: r.error, equipoId: r.equipoExistenteId });
            return;
          }
          navigate(`/equipos/${r.valor.equipo.id}`, { state: { exito: `Equipo ${r.valor.equipo.id} guardado.` } });
        }}
      >
        <label className={estilos.etiqueta}>
          Tipo
          <select
            className={estilos.campo}
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as NuevoEquipo["tipo"] })}
          >
            {TIPOS_EQUIPO.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        {campo("serie", "Número de serie o IMEI", "En celulares, el IMEI (*#06#).")}
        {campo("marca", "Marca")}
        {campo("modelo", "Modelo")}
        {campo("accesorios", "Accesorios que deja", "Ej.: cargador, funda.")}
        {campo("estadoFisico", "Estado físico", "Golpes, rayones, piezas flojas.")}

        <fieldset className="grid gap-4 border-t border-grafito/15 pt-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="font-titulo text-lg font-bold">Quién lo deja</legend>
          <label className={estilos.etiqueta}>
            Nombre
            <input
              className={estilos.campo}
              value={form.contacto.nombre}
              onChange={(e) => setForm({ ...form, contacto: { ...form.contacto, nombre: e.target.value } })}
            />
          </label>
          <label className={estilos.etiqueta}>
            Teléfono
            <input
              type="tel"
              className={estilos.campo}
              value={form.contacto.telefono}
              onChange={(e) => setForm({ ...form, contacto: { ...form.contacto, telefono: e.target.value } })}
            />
          </label>
        </fieldset>

        <div className="grid gap-3 sm:col-span-2">
          {error && (
            <div className="grid gap-1">
              <Mensaje tipo="error" texto={error.texto} />
              {error.equipoId && (
                <Link to={`/equipos/${error.equipoId}`} className={estilos.enlace}>
                  Ver la ficha {error.equipoId}
                </Link>
              )}
            </div>
          )}
          <NotaDemo />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={estilos.boton}>
              Guardar equipo
            </button>
            <Link to="/" className={estilos.botonSecundario}>
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}
