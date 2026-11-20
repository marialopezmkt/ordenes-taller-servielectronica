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

function abrirOrdenDe(modelo: RegExp) {
  abrir("/");
  fireEvent.click(screen.getByRole("link", { name: modelo }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  salir();
  entrar(CLAVE_PANEL);
});

describe("acceso", () => {
  it("pide la clave y con la correcta entra a la mesa", () => {
    salir();
    abrir("/");
    fireEvent.change(screen.getByLabelText("Clave del panel"), { target: { value: "otra" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Clave incorrecta");
    fireEvent.change(screen.getByLabelText("Clave del panel"), { target: { value: CLAVE_PANEL } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByRole("heading", { name: "Mesa" })).toBeInTheDocument();
  });
});

describe("criterio 7: filtros y contador", () => {
  it("los filtros se combinan y el contador coincide con la lista", () => {
    abrir("/");
    const contar = () => within(screen.getByRole("list", { name: "Órdenes" })).getAllByRole("listitem").length;
    expect(screen.getByTestId("contador")).toHaveTextContent("10 órdenes");
    expect(contar()).toBe(10);

    fireEvent.change(screen.getByLabelText("Tipo de equipo"), { target: { value: "notebook" } });
    expect(screen.getByTestId("contador")).toHaveTextContent(`${contar()} órdenes`);
    expect(contar()).toBe(4);

    fireEvent.change(screen.getByLabelText("Días desde el ingreso"), { target: { value: "mas30" } });
    expect(screen.getByTestId("contador")).toHaveTextContent("2 órdenes");
    expect(contar()).toBe(2);

    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "lista_para_retirar" } });
    expect(screen.getByTestId("contador")).toHaveTextContent("1 orden");
    expect(contar()).toBe(1);
  });
});

describe("criterio 5: retiro atrasado en la mesa", () => {
  it("la orden lista desde hace 35 días muestra «Retiro atrasado»", () => {
    abrir("/");
    const tarjeta = screen.getByRole("link", { name: /HP 14-dq2/ });
    expect(tarjeta).toHaveTextContent("Retiro atrasado");
    expect(tarjeta).toHaveTextContent("Lista para retirar desde hace 35 días");
  });
});

describe("prueba guiada: rechazo desde Esperando aprobación", () => {
  it("pasa a retiro con costo de diagnóstico, sin repuestos ni trabajo reparado", () => {
    abrirOrdenDe(/Galaxy A54/);
    expect(screen.getByTestId("total")).toHaveTextContent("CLP $36.000");
    fireEvent.click(screen.getByRole("button", { name: "Rechazó: a retiro" }));

    expect(screen.getByRole("status")).toHaveTextContent("Guardado: la orden pasó a Lista para retirar.");
    expect(screen.getByRole("status")).toHaveTextContent("Guardar no avisa al cliente");
    expect(screen.getByTestId("total")).toHaveTextContent("CLP $10.000");
    expect(screen.getByText("Presupuesto").nextSibling).toHaveTextContent("Rechazado");
    expect(screen.getByText("Trabajo reparado").nextSibling).toHaveTextContent("No");
    expect(screen.getByText("Repuestos consumidos").nextSibling).toHaveTextContent("No");
    expect(screen.queryByText(/^Repuesto:/)).not.toBeInTheDocument();
  });
});

describe("criterio 3: aprobar descuenta el diagnóstico", () => {
  it("muestra la línea de descuento y el total sin diagnóstico", () => {
    abrirOrdenDe(/Galaxy A54/);
    fireEvent.click(screen.getByRole("button", { name: "Aprobó: reparar" }));
    expect(screen.getByText("Descuento del diagnóstico (aprobó)")).toBeInTheDocument();
    expect(screen.getByTestId("total")).toHaveTextContent("CLP $26.000");
  });
});

describe("criterio 6: pasos de la tabla", () => {
  it("desde Esperando aprobación solo ofrece aprobar o rechazar", () => {
    abrirOrdenDe(/Galaxy A54/);
    const pasos = within(screen.getByRole("region", { name: "Próximo paso" })).getAllByRole("button");
    expect(pasos.map((b) => b.textContent)).toEqual(["Aprobó: reparar", "Rechazó: a retiro"]);
  });

  it("un estado final no muestra botones", () => {
    abrirOrdenDe(/Moto G32/);
    const region = screen.getByRole("region", { name: "Próximo paso" });
    expect(within(region).queryAllByRole("button")).toHaveLength(0);
    expect(region).toHaveTextContent("Orden cerrada");
  });
});

describe("criterio 1: serie repetida", () => {
  it("no guarda y avisa cuál es la ficha existente", () => {
    abrir("/equipos/nuevo");
    fireEvent.change(screen.getByLabelText(/Número de serie o IMEI/), { target: { value: "pf3k9qzl" } });
    fireEvent.change(screen.getByLabelText("Marca"), { target: { value: "Lenovo" } });
    fireEvent.change(screen.getByLabelText("Modelo"), { target: { value: "IdeaPad" } });
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Cliente de prueba" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar equipo" }));
    expect(screen.getByRole("alert")).toHaveTextContent("ficha EQ-0001");
    expect(screen.getByRole("link", { name: "Ver la ficha EQ-0001" })).toBeInTheDocument();
    // El borrador queda en pantalla.
    expect(screen.getByLabelText("Marca")).toHaveValue("Lenovo");
  });
});

describe("criterio 2: una orden abierta por equipo", () => {
  it("la ficha no deja abrir otra orden", () => {
    abrir("/equipos/EQ-0005");
    expect(screen.getByRole("note")).toHaveTextContent("no se puede abrir otra");
    expect(screen.queryByRole("button", { name: "Abrir orden" })).not.toBeInTheDocument();
  });
});

describe("criterio 4: garantía", () => {
  it("una orden nueva sobre un equipo entregado hace 60 días va en garantía", () => {
    abrir("/equipos/EQ-0004");
    expect(screen.getByText(/La orden nueva entra en garantía/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Qué falla"), { target: { value: "La batería vuelve a durar poco" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir orden" }));
    expect(screen.getByRole("status")).toHaveTextContent("abierta");
    expect(screen.getAllByText("En garantía").length).toBeGreaterThan(0);
    expect(screen.getByText("Diagnóstico (en garantía)")).toBeInTheDocument();
    expect(screen.getByTestId("total")).toHaveTextContent("CLP $0");
  });
});

describe("garantía: una entrega sin reparación no la da y la ficha lo explica", () => {
  it("rechazar y entregar el Galaxy A54 deja la ficha sin garantía, con el motivo a la vista", () => {
    abrirOrdenDe(/Galaxy A54/);
    fireEvent.click(screen.getByRole("button", { name: "Rechazó: a retiro" }));
    fireEvent.click(screen.getByRole("button", { name: "Entregar" }));
    fireEvent.click(screen.getByRole("link", { name: /Celular Samsung Galaxy A54/ }));
    expect(screen.getByTestId("sin-garantia")).toHaveTextContent(
      "fue sin reparación porque el cliente rechazó el presupuesto",
    );
    expect(screen.queryByText(/La orden nueva entra en garantía/)).not.toBeInTheDocument();
  });
});

describe("criterio 8: los datos siguen al recargar", () => {
  it("un cambio guardado sigue ahí al volver a montar la app", () => {
    abrirOrdenDe(/Galaxy A54/);
    fireEvent.click(screen.getByRole("button", { name: "Rechazó: a retiro" }));
    document.body.innerHTML = "";
    abrirOrdenDe(/Galaxy A54/);
    expect(screen.getByTestId("total")).toHaveTextContent("CLP $10.000");
  });
});
