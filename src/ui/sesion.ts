// Acceso del panel: una clave simple escrita en el código.
// Es un acceso local, SIN verificación de identidad (ver README para cambiarla).

/** Clave del panel. Para cambiarla, editá este valor y volvé a publicar. */
export const CLAVE_PANEL = "mostrador2026";

const CLAVE_SESION = "servielectronica-ot:sesion";

/** Respaldo en memoria por si el navegador no deja usar sessionStorage. */
let dentro = false;

export function estaDentro(): boolean {
  if (dentro) return true;
  try {
    return window.sessionStorage.getItem(CLAVE_SESION) === "si";
  } catch {
    return false;
  }
}

/** Devuelve false si la clave no coincide. */
export function entrar(clave: string): boolean {
  if (clave.trim() !== CLAVE_PANEL) return false;
  dentro = true;
  try {
    window.sessionStorage.setItem(CLAVE_SESION, "si");
  } catch {
    // Sin sessionStorage la sesión dura hasta recargar; no bloquea el uso.
  }
  return true;
}

export function salir(): void {
  dentro = false;
  try {
    window.sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // nada que borrar
  }
}
