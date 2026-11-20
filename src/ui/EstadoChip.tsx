import { nombreEstado, type EstadoOrden } from "@/dominio/modelo";

/** Cada estado tiene su color, siempre con texto legible. */
const COLORES: Record<EstadoOrden, string> = {
  ingresado: "bg-fondo border-gris text-grafito",
  en_diagnostico: "bg-celeste/15 border-celeste text-grafito",
  esperando_aprobacion: "bg-naranja/15 border-naranja text-grafito border-dashed",
  en_reparacion: "bg-celeste border-celeste text-grafito",
  esperando_repuesto: "bg-gris border-gris text-blanco",
  lista_para_retirar: "bg-verde/15 border-verde text-grafito",
  entregado: "bg-grafito border-grafito text-blanco",
  sin_reparacion: "bg-blanco border-grafito text-grafito border-dashed",
};

export function EstadoChip({ estado }: { estado: EstadoOrden }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border-2 px-2.5 py-0.5 text-sm font-semibold ${COLORES[estado]}`}
    >
      {nombreEstado(estado)}
    </span>
  );
}

export function Etiqueta({ texto, tono }: { texto: string; tono: "naranja" | "verde" }) {
  const clases =
    tono === "naranja" ? "bg-naranja text-grafito" : "bg-verde/15 text-grafito border border-verde";
  return (
    <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-sm font-semibold ${clases}`}>
      {texto}
    </span>
  );
}
