import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { entrar, estaDentro } from "@/ui/sesion";
import { estilos } from "@/ui/formato";

export function Acceso() {
  const navigate = useNavigate();
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  if (estaDentro()) return <Navigate to="/" replace />;

  return (
    <main className="flex min-h-svh items-center justify-center bg-grafito px-4">
      <form
        className="w-full max-w-sm rounded-lg bg-blanco p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (entrar(clave)) navigate("/");
          else setError("Clave incorrecta. Probá de nuevo.");
        }}
      >
        <p className="font-titulo text-sm font-bold uppercase tracking-wide text-gris">Servielectronica</p>
        <h1 className="mt-1 text-2xl font-bold">Órdenes de trabajo</h1>
        <p className="mt-2 text-sm text-gris">Panel interno del mostrador.</p>
        <label className={`${estilos.etiqueta} mt-5`} htmlFor="clave">
          Clave del panel
        </label>
        <input
          id="clave"
          type="password"
          autoComplete="current-password"
          className={estilos.campo}
          value={clave}
          onChange={(e) => {
            setClave(e.target.value);
            setError("");
          }}
        />
        {error && (
          <p role="alert" className="mt-2 text-sm font-semibold text-grafito">
            {error}
          </p>
        )}
        <button type="submit" className={`${estilos.boton} mt-4 w-full`}>
          Entrar
        </button>
        <p className="mt-4 text-xs text-gris">
          Acceso local de demostración: la clave está escrita en el código y no verifica identidad.
        </p>
      </form>
    </main>
  );
}
