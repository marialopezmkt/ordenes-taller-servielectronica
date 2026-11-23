import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { CLAVE_PANEL, entrar, salir } from "@/ui/sesion";

function abrir(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  );
}

const tarjeta = (nombre: string) => screen.getByRole("listitem", { name: nombre });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  salir();
  entrar(CLAVE_PANEL);
});

describe("menú", () => {
  it("Catálogo y Ajustes están en el menú", () => {
    abrir("/");
    const menu = screen.getByRole("navigation", { name: "Principal" });
    expect(within(menu).getByRole("link", { name: "Catálogo" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Ajustes" })).toBeInTheDocument();
  });
});

describe("criterio 10: alta, edición y pausa con atributos obligatorios", () => {
  it("da de alta un servicio con sus cuatro atributos", () => {
    abrir("/catalogo");
    expect(screen.getByText(/10 servicios · 10 activos/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nuevo servicio" }));
    const form = screen.getByRole("region", { name: "Nuevo servicio" });
    fireEvent.change(within(form).getByLabelText("Nombre"), { target: { value: "Cambio de teclado de notebook" } });
    fireEvent.click(within(form).getByLabelText("Notebook"));
    fireEvent.change(within(form).getByLabelText(/Precio/), { target: { value: "24.000" } });
    fireEvent.change(within(form).getByLabelText(/Días/), { target: { value: "2" } });
    fireEvent.click(within(form).getByRole("button", { name: "Agregar servicio" }));

    expect(screen.getByRole("status")).toHaveTextContent("agregado al catálogo");
    const nuevo = tarjeta("Cambio de teclado de notebook");
    expect(nuevo).toHaveTextContent("Activo");
    expect(nuevo).toHaveTextContent("CLP $24.000 · 2 días");
    expect(screen.getByText(/11 servicios · 11 activos/)).toBeInTheDocument();
  });

  it("si falta un atributo obligatorio no guarda, avisa y conserva lo escrito", () => {
    abrir("/catalogo");
    fireEvent.click(screen.getByRole("button", { name: "Nuevo servicio" }));
    const form = screen.getByRole("region", { name: "Nuevo servicio" });
    fireEvent.change(within(form).getByLabelText("Nombre"), { target: { value: "Servicio sin precio" } });
    fireEvent.click(within(form).getByLabelText("Celular"));
    fireEvent.change(within(form).getByLabelText(/Días/), { target: { value: "1" } });
    fireEvent.click(within(form).getByRole("button", { name: "Agregar servicio" }));

    expect(within(form).getByRole("alert")).toHaveTextContent("precio");
    expect(within(form).getByLabelText("Nombre")).toHaveValue("Servicio sin precio");
    expect(screen.getByText(/10 servicios/)).toBeInTheDocument();
  });

  it("edita el precio y la tarjeta muestra el valor nuevo", () => {
    abrir("/catalogo");
    const limpieza = tarjeta("Limpieza interna y cambio de pasta térmica");
    fireEvent.click(within(limpieza).getByRole("button", { name: "Editar" }));
    const edicion = tarjeta("Limpieza interna y cambio de pasta térmica");
    fireEvent.change(within(edicion).getByLabelText(/Precio/), { target: { value: "24000" } });
    fireEvent.click(within(edicion).getByRole("button", { name: "Guardar cambios" }));
    const actualizada = tarjeta("Limpieza interna y cambio de pasta térmica");
    expect(actualizada).toHaveTextContent("CLP $24.000");
    expect(within(actualizada).getByRole("status")).toHaveTextContent("actualizado");
  });

  it("pausar marca el servicio y deja de ofrecerse en un diagnóstico nuevo", () => {
    abrir("/catalogo");
    fireEvent.click(within(tarjeta("Cambio de batería de celular")).getByRole("button", { name: "Pausar" }));
    expect(tarjeta("Cambio de batería de celular")).toHaveTextContent("Pausado");
    expect(within(tarjeta("Cambio de batería de celular")).getByRole("button", { name: "Reactivar" })).toBeInTheDocument();

    // La orden del iPhone (Ingresado): al pasarla a diagnóstico, la batería no aparece.
    fireEvent.click(screen.getByRole("link", { name: "Mesa" }));
    fireEvent.click(screen.getByRole("link", { name: /iPhone 11/ }));
    fireEvent.click(screen.getByRole("button", { name: "Pasar a diagnóstico" }));
    expect(screen.queryByLabelText(/Cambio de batería de celular/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Cambio de pin de carga de celular/)).toBeInTheDocument();
  });

  it("el Diagnóstico general no ofrece pausar ni borrar", () => {
    abrir("/catalogo");
    const diag = tarjeta("Diagnóstico general");
    expect(within(diag).queryByRole("button", { name: "Pausar" })).not.toBeInTheDocument();
    expect(within(diag).queryByRole("button", { name: "Borrar" })).not.toBeInTheDocument();
  });
});

describe("criterio 11: no se borra un servicio con órdenes abiertas", () => {
  it("avisa en la tarjeta en qué órdenes abiertas está y no lo borra", () => {
    abrir("/catalogo");
    const pin = tarjeta("Cambio de pin de carga de celular");
    expect(pin).toHaveTextContent(/En 1 orden abierta: OT-\d{4}-\d{3}/);
    fireEvent.click(within(pin).getByRole("button", { name: "Borrar" }));
    expect(within(tarjeta("Cambio de pin de carga de celular")).getByRole("alert")).toHaveTextContent(
      /No se puede borrar «Cambio de pin de carga de celular»: está en la orden abierta OT-/,
    );
    expect(screen.getByText(/10 servicios/)).toBeInTheDocument();
  });

  it("un servicio sin órdenes abiertas se borra después de confirmar", () => {
    abrir("/catalogo");
    const recuperacion = tarjeta("Recuperación de datos básica");
    fireEvent.click(within(recuperacion).getByRole("button", { name: "Borrar" }));
    fireEvent.click(within(tarjeta("Recuperación de datos básica")).getByRole("button", { name: "Sí, borrar" }));
    expect(screen.queryByRole("listitem", { name: "Recuperación de datos básica" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("borrado del catálogo");
    expect(screen.getByText(/9 servicios/)).toBeInTheDocument();
  });
});

describe("criterio 12: Restaurar datos de prueba", () => {
  it("pide confirmación y vuelve a la semilla sin usar la consola", () => {
    abrir("/catalogo");
    fireEvent.click(within(tarjeta("Cambio de batería de celular")).getByRole("button", { name: "Pausar" }));
    fireEvent.click(screen.getByRole("link", { name: "Ajustes" }));
    expect(screen.getByText(/Ahora hay/)).toHaveTextContent("Ahora hay 14 equipos y 18 órdenes");

    fireEvent.click(screen.getByRole("button", { name: "Restaurar datos de prueba" }));
    const confirmar = screen.getByRole("group", { name: "Confirmar restauración" });
    fireEvent.click(within(confirmar).getByRole("button", { name: "Sí, restaurar" }));
    expect(screen.getByRole("status")).toHaveTextContent("Datos de prueba restaurados: 14 equipos, 18 órdenes");

    fireEvent.click(screen.getByRole("link", { name: "Catálogo" }));
    expect(tarjeta("Cambio de batería de celular")).toHaveTextContent("Activo");
  });

  it("cancelar no cambia nada", () => {
    abrir("/catalogo");
    fireEvent.click(within(tarjeta("Cambio de batería de celular")).getByRole("button", { name: "Pausar" }));
    fireEvent.click(screen.getByRole("link", { name: "Ajustes" }));
    fireEvent.click(screen.getByRole("button", { name: "Restaurar datos de prueba" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("link", { name: "Catálogo" }));
    expect(tarjeta("Cambio de batería de celular")).toHaveTextContent("Pausado");
  });

  it("muestra los parámetros vigentes", () => {
    abrir("/ajustes");
    expect(screen.getByText("90 días desde la entrega")).toBeInTheDocument();
    expect(screen.getByText(/Más de 30 días en Lista para retirar/)).toBeInTheDocument();
    expect(screen.getByText(/CLP \$10\.000/)).toBeInTheDocument();
  });
});
