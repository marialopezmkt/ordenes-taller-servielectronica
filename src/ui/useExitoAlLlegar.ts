import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Mensaje de éxito que trae la navegación (por ejemplo «Orden OT-… abierta.»).
 * Se muestra una sola vez: después se borra del historial para que no
 * reaparezca al recargar la página.
 */
export function useExitoAlLlegar(): string | undefined {
  const location = useLocation();
  const navigate = useNavigate();
  const [exito] = useState(() => (location.state as { exito?: string } | null)?.exito);

  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  return exito;
}
