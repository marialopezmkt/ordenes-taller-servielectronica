import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useDatos } from "@/datos/contexto";
import { crearSemilla } from "@/datos/semilla";
import { DIAS_GARANTIA, DIAS_RETIRO_ATRASADO, ID_DIAGNOSTICO } from "@/dominio/modelo";
import { estilos, formatoPesos } from "@/ui/formato";
import { Mensaje } from "@/ui/Marco";

export function Ajustes() {
  const { datos, ejecutar } = useDatos();
  const [confirmar, setConfirmar] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "error" | "exito"; texto: string } | null>(null);
  const diagnostico = datos.catalogo.find((s) => s.id === ID_DIAGNOSTICO);

  function restaurar() {
    const r = ejecutar((_datos, hoy) => ({ ok: true as const, valor: { datos: crearSemilla(hoy) } }));
    setConfirmar(false);
    setMensaje(
      r.ok
        ? {
            tipo: "exito",
            texto: `Datos de prueba restaurados: ${r.valor.datos.equipos.length} equipos, ${r.valor.datos.ordenes.length} órdenes y el catálogo inicial.`,
          }
        : { tipo: "error", texto: r.error },
    );
  }

  const parametros: [string, ReactNode][] = [
    [
      "Valor del diagnóstico",
      <>
        {diagnostico ? formatoPesos(diagnostico.precio) : "—"} ·{" "}
        <Link to="/catalogo" className={estilos.enlaceSuelto}>
          se edita en Catálogo
        </Link>
      </>,
    ],
    ["Garantía", `${DIAS_GARANTIA} días desde la entrega`],
    ["Retiro atrasado", `Más de ${DIAS_RETIRO_ATRASADO} días en Lista para retirar`],
    ["Clave del panel", "Escrita en el código (acceso local, sin verificación de identidad)"],
    ["Horario del mostrador", "Lunes a viernes de 10 a 19 y sábados de 10 a 14"],
  ];

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-sm text-gris">Datos de prueba y parámetros del taller</p>
      </div>

      <section className={estilos.panel} aria-labelledby="titulo-datos">
        <h2 id="titulo-datos" className="text-xl font-bold">
          Datos de prueba
        </h2>
        <p className="mt-2">
          Ahora hay <span className="font-semibold">{datos.equipos.length} equipos</span> y{" "}
          <span className="font-semibold">{datos.ordenes.length} órdenes</span> guardados en este navegador. Restaurar
          vuelve a los datos de ejemplo: 14 equipos, 18 órdenes en todos los estados y el catálogo inicial.
        </p>

        {confirmar ? (
          <div
            className="mt-3 grid gap-2 rounded-md border-2 border-naranja bg-naranja/10 p-3"
            role="group"
            aria-label="Confirmar restauración"
          >
            <p className="font-semibold">
              Se borra todo lo cargado en este navegador (equipos, órdenes y cambios del catálogo). ¿Restaurar?
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={estilos.boton} onClick={restaurar}>
                Sí, restaurar
              </button>
              <button type="button" className={estilos.botonSecundario} onClick={() => setConfirmar(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={`${estilos.boton} mt-3`}
            onClick={() => {
              setConfirmar(true);
              setMensaje(null);
            }}
          >
            Restaurar datos de prueba
          </button>
        )}
        {mensaje && (
          <div className="mt-3">
            <Mensaje tipo={mensaje.tipo} texto={mensaje.texto} />
          </div>
        )}
      </section>

      <section className={estilos.panel} aria-labelledby="titulo-parametros">
        <h2 id="titulo-parametros" className="text-xl font-bold">
          Parámetros
        </h2>
        <dl className="mt-3 grid border-l border-t border-grafito/20 sm:grid-cols-2">
          {parametros.map(([k, v]) => (
            <div key={k} className="border-b border-r border-grafito/20 px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gris">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-gris">
          La garantía, el retiro atrasado y la clave se cambian en el código. El README explica cómo, en la sección
          «Reglas y pruebas».
        </p>
      </section>
    </div>
  );
}
