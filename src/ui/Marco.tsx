import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useDatos } from "@/datos/contexto";
import { estaDentro, salir } from "./sesion";

const TEXTO_DEMO =
  "Demo: los datos se guardan solo en este navegador. Guardar no avisa al cliente ni al negocio.";

/** Marco de las pantallas internas: pide la clave y muestra la navegación. */
export function Marco() {
  const { aviso } = useDatos();
  const navigate = useNavigate();
  if (!estaDentro()) return <Navigate to="/acceso" replace />;

  const nav = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded-md px-3 font-semibold ${
      isActive ? "bg-celeste text-grafito" : "text-blanco hover:bg-blanco/10"
    }`;

  return (
    <div className="min-h-svh">
      <header className="bg-grafito text-blanco">
        {/* En celular: logo centrado y el menú debajo, también centrado. En escritorio: una sola fila. */}
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-4 py-2 sm:flex-row sm:gap-x-4">
          <Link to="/" className="text-center font-titulo text-lg font-bold leading-tight text-blanco sm:text-left">
            Servielectronica
            <span className="block text-xs font-normal text-blanco/70">Órdenes de trabajo</span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-1 sm:ml-auto" aria-label="Principal">
            <NavLink to="/" end className={nav}>
              Mesa
            </NavLink>
            <NavLink to="/equipos/nuevo" className={nav}>
              Nuevo equipo
            </NavLink>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-md px-3 text-blanco/80 hover:bg-blanco/10"
              onClick={() => {
                salir();
                navigate("/acceso");
              }}
            >
              Salir
            </button>
          </nav>
        </div>
      </header>
      {aviso && (
        <p role="alert" className="bg-naranja px-4 py-2 text-center text-sm font-semibold text-grafito">
          {aviso}
        </p>
      )}
      <main className="mx-auto max-w-5xl px-4 py-4">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-6 text-xs text-gris">
        {TEXTO_DEMO} Mostrador: lunes a viernes de 10 a 19 y sábados de 10 a 14.
      </footer>
    </div>
  );
}

/** Aviso de demo que va en cada formulario y en cada confirmación. */
export function NotaDemo() {
  return <p className="text-xs text-gris">{TEXTO_DEMO}</p>;
}

export function Mensaje({ tipo, texto }: { tipo: "error" | "exito"; texto: string }) {
  if (tipo === "error") {
    return (
      <p role="alert" className="rounded-md border-2 border-naranja bg-naranja/10 px-3 py-2 font-semibold">
        {texto}
      </p>
    );
  }
  return (
    <div role="status" className="rounded-md border-2 border-verde bg-verde/10 px-3 py-2">
      <p className="font-semibold">{texto}</p>
      <NotaDemo />
    </div>
  );
}
