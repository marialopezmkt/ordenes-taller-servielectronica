// Datos de ejemplo sintéticos (personas y teléfonos inventados).
// Se arman con las mismas acciones del dominio y con fechas relativas a hoy,
// así la garantía y el retiro atrasado se ven siempre en la demo.
import { abrirOrden, aplicarAccion, cargarDiagnostico, crearEquipo, type NuevoEquipo } from "@/dominio/acciones";
import { sumarDias } from "@/dominio/fechas";
import { datosVacios, type DatosTaller, type Fecha, type IdAccion, type LineaRepuesto, type Resultado } from "@/dominio/modelo";

function ok<T>(r: Resultado<T>): T {
  if (!r.ok) throw new Error(`Semilla inválida: ${r.error}`);
  return r.valor;
}

type Paso = { accion: IdAccion; hace: number };

type OrdenEjemplo = {
  equipo: string;
  falla: string;
  ingresoHace: number;
  diagnostico?: { texto: string; servicios: string[]; repuestos?: LineaRepuesto[] };
  pasos: Paso[];
};

const EQUIPOS: NuevoEquipo[] = [
  {
    tipo: "notebook", marca: "Lenovo", modelo: "IdeaPad 3 15ITL6", serie: "PF3K9QZL",
    accesorios: "Cargador original", estadoFisico: "Bisagra izquierda floja, tapa con rayones",
    contacto: { nombre: "Valentina R.", telefono: "+56 9 5555 0101" },
  },
  {
    tipo: "celular", marca: "Samsung", modelo: "Galaxy A54", serie: "356789104512338",
    accesorios: "Funda transparente", estadoFisico: "Pantalla sana, puerto de carga con pelusa",
    contacto: { nombre: "Matías C.", telefono: "+56 9 5555 0102" },
  },
  {
    tipo: "notebook", marca: "HP", modelo: "14-dq2", serie: "5CD1234XYZ",
    accesorios: "Sin accesorios", estadoFisico: "Teclado con dos teclas gastadas",
    contacto: { nombre: "Ignacio P.", telefono: "+56 9 5555 0103" },
  },
  {
    tipo: "celular", marca: "Motorola", modelo: "Moto G32", serie: "359812047761205",
    accesorios: "Cargador y cable", estadoFisico: "Buen estado general",
    contacto: { nombre: "Fernanda M.", telefono: "+56 9 5555 0104" },
  },
  {
    tipo: "pc", marca: "Armada", modelo: "Torre Ryzen 5", serie: "PC-TALLER-0458",
    accesorios: "Cable de poder", estadoFisico: "Gabinete con polvo, sin golpes",
    contacto: { nombre: "Jorge A.", telefono: "+56 9 5555 0105" },
  },
  {
    tipo: "tablet", marca: "Samsung", modelo: "Galaxy Tab A8", serie: "R9WT30ABCDE",
    accesorios: "Funda con teclado", estadoFisico: "Vidrio trizado en la esquina inferior",
    contacto: { nombre: "Catalina V.", telefono: "+56 9 5555 0106" },
  },
  {
    tipo: "notebook", marca: "Dell", modelo: "Inspiron 15 3520", serie: "7HX2MN3",
    accesorios: "Cargador", estadoFisico: "Buen estado",
    contacto: { nombre: "Rodrigo S.", telefono: "+56 9 5555 0107" },
  },
  {
    tipo: "celular", marca: "Apple", modelo: "iPhone 11", serie: "353987102244561",
    accesorios: "Sin accesorios", estadoFisico: "Marco con golpe en la esquina superior",
    contacto: { nombre: "Daniela T.", telefono: "+56 9 5555 0108" },
  },
  {
    tipo: "notebook", marca: "Asus", modelo: "VivoBook 15 X1502", serie: "N3NRKD012345678",
    accesorios: "Cargador y mouse", estadoFisico: "Buen estado",
    contacto: { nombre: "Tomás G.", telefono: "+56 9 5555 0109" },
  },
  {
    tipo: "celular", marca: "Xiaomi", modelo: "Redmi Note 12", serie: "864213059987412",
    accesorios: "Sin accesorios", estadoFisico: "Mojado, con marcas de humedad",
    contacto: { nombre: "Paula N.", telefono: "+56 9 5555 0110" },
  },
  {
    tipo: "tablet", marca: "Lenovo", modelo: "Tab M10 HD", serie: "HGT4K2PQ",
    accesorios: "Cargador", estadoFisico: "Esquina superior golpeada",
    contacto: { nombre: "Sofía L.", telefono: "+56 9 5555 0111" },
  },
  {
    tipo: "celular", marca: "Samsung", modelo: "Galaxy A14", serie: "352940118833076",
    accesorios: "Funda con tapa", estadoFisico: "Buen estado general",
    contacto: { nombre: "Benjamín O.", telefono: "+56 9 5555 0112" },
  },
  {
    tipo: "pc", marca: "HP", modelo: "All-in-One 24-cb1", serie: "8CC2104XKZ",
    accesorios: "Teclado y mouse inalámbricos", estadoFisico: "Pantalla sin rayones",
    contacto: { nombre: "Carolina F.", telefono: "+56 9 5555 0113" },
  },
  {
    tipo: "notebook", marca: "Acer", modelo: "Aspire 5 A515", serie: "NXA1ZAL0072310",
    accesorios: "Cargador y funda", estadoFisico: "Bisagra derecha cortada, tapa abierta a 90°",
    contacto: { nombre: "Diego M.", telefono: "+56 9 5555 0114" },
  },
];

// Ids que asigna crearEquipo, en el orden de EQUIPOS.
const ORDENES: OrdenEjemplo[] = [
  // El caso del escenario: se apaga sola, limpieza y pasta térmica, lista para retirar.
  {
    equipo: "EQ-0001", falla: "Se apaga sola a los diez minutos de uso", ingresoHace: 5,
    diagnostico: { texto: "Sobrecalentamiento: ventilador con polvo y pasta térmica seca.", servicios: ["limpieza"] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 4 }, { accion: "enviar_presupuesto", hace: 4 },
      { accion: "aprobar", hace: 4 }, { accion: "terminar_reparacion", hace: 1 },
    ],
  },
  // Para la prueba guiada: esperando que el cliente apruebe o rechace.
  {
    equipo: "EQ-0002", falla: "No carga, solo con el cable en cierta posición", ingresoHace: 3,
    diagnostico: {
      texto: "Pin de carga desgastado.", servicios: ["pin_carga"],
      repuestos: [{ descripcion: "Pin de carga USB-C", precio: 6000 }],
    },
    pasos: [{ accion: "iniciar_diagnostico", hace: 2 }, { accion: "enviar_presupuesto", hace: 2 }],
  },
  // Rechazó hace 35 días y nunca vino a buscarla: retiro atrasado.
  {
    equipo: "EQ-0003", falla: "Pantalla con líneas verticales", ingresoHace: 40,
    diagnostico: { texto: "Panel LCD dañado, hay que cambiarlo.", servicios: ["pantalla_notebook"], repuestos: [{ descripcion: "Panel LCD 14\" FHD", precio: 45000 }] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 39 }, { accion: "enviar_presupuesto", hace: 38 },
      { accion: "rechazar", hace: 35 },
    ],
  },
  // Entregado hace 60 días: una orden nueva entra en garantía.
  {
    equipo: "EQ-0004", falla: "La batería dura menos de dos horas", ingresoHace: 64,
    diagnostico: { texto: "Batería hinchada, al 61 % de capacidad.", servicios: ["bateria_celular"], repuestos: [{ descripcion: "Batería 5000 mAh", precio: 14000 }] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 63 }, { accion: "enviar_presupuesto", hace: 63 },
      { accion: "aprobar", hace: 63 }, { accion: "terminar_reparacion", hace: 62 },
      { accion: "entregar", hace: 60 },
    ],
  },
  {
    equipo: "EQ-0005", falla: "Muy lenta, tarda cinco minutos en arrancar", ingresoHace: 9,
    diagnostico: { texto: "Disco mecánico con sectores dañados. Conviene SSD y sistema limpio.", servicios: ["ssd", "formateo"], repuestos: [{ descripcion: "SSD 480 GB", precio: 28000 }] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 8 }, { accion: "enviar_presupuesto", hace: 8 },
      { accion: "aprobar", hace: 7 },
    ],
  },
  {
    equipo: "EQ-0006", falla: "Vidrio trizado, el táctil no responde abajo", ingresoHace: 15,
    diagnostico: { texto: "Digitalizador roto. Hay que pedir pantalla completa.", servicios: ["pantalla_celular"], repuestos: [{ descripcion: "Pantalla Tab A8 completa", precio: 52000 }] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 14 }, { accion: "enviar_presupuesto", hace: 14 },
      { accion: "aprobar", hace: 13 }, { accion: "esperar_repuesto", hace: 12 },
    ],
  },
  // Entregado hace 120 días: ya sin garantía.
  {
    equipo: "EQ-0007", falla: "Pide reinstalar Windows al arrancar", ingresoHace: 124,
    diagnostico: { texto: "Sistema dañado, disco sano.", servicios: ["formateo"] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 123 }, { accion: "enviar_presupuesto", hace: 123 },
      { accion: "aprobar", hace: 123 }, { accion: "terminar_reparacion", hace: 122 },
      { accion: "entregar", hace: 120 },
    ],
  },
  { equipo: "EQ-0008", falla: "Se reinicia al abrir la cámara", ingresoHace: 0, pasos: [] },
  { equipo: "EQ-0009", falla: "No da imagen, prende la luz de encendido", ingresoHace: 1, pasos: [{ accion: "iniciar_diagnostico", hace: 1 }] },
  // Se intentó recuperar datos y no hubo arreglo posible.
  {
    equipo: "EQ-0010", falla: "Se mojó y no enciende; necesita las fotos", ingresoHace: 26,
    diagnostico: { texto: "Placa con corrosión. Se intenta recuperar datos.", servicios: ["recuperacion"] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 25 }, { accion: "enviar_presupuesto", hace: 25 },
      { accion: "aprobar", hace: 24 }, { accion: "terminar_reparacion", hace: 21 },
      { accion: "sin_arreglo", hace: 20 },
    ],
  },
  // Volvió después del intento fallido: cambio de batería, listo para retirar.
  {
    equipo: "EQ-0010", falla: "Ya enciende, pero la batería se descarga en una hora", ingresoHace: 9,
    diagnostico: { texto: "Batería dañada por la humedad.", servicios: ["bateria_celular"], repuestos: [{ descripcion: "Batería 5000 mAh", precio: 14000 }] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 8 }, { accion: "enviar_presupuesto", hace: 8 },
      { accion: "aprobar", hace: 7 }, { accion: "terminar_reparacion", hace: 2 },
    ],
  },
  // Entregado hace 120 días (sin garantía) y de vuelta en diagnóstico.
  {
    equipo: "EQ-0007", falla: "La bisagra izquierda cruje al abrir", ingresoHace: 2,
    pasos: [{ accion: "iniciar_diagnostico", hace: 1 }],
  },
  // Tablet: un intento anterior sin arreglo posible y ahora en reparación.
  {
    equipo: "EQ-0011", falla: "No enciende después de una caída", ingresoHace: 160,
    diagnostico: { texto: "Placa madre partida. Se intenta reparar el conector.", servicios: ["recuperacion"] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 159 }, { accion: "enviar_presupuesto", hace: 158 },
      { accion: "aprobar", hace: 158 }, { accion: "terminar_reparacion", hace: 152 },
      { accion: "sin_arreglo", hace: 150 },
    ],
  },
  {
    equipo: "EQ-0011", falla: "Pantalla trizada, el táctil falla en el borde", ingresoHace: 6,
    diagnostico: { texto: "Digitalizador roto.", servicios: ["pantalla_celular"], repuestos: [{ descripcion: "Pantalla Tab M10 completa", precio: 39000 }] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 5 }, { accion: "enviar_presupuesto", hace: 5 },
      { accion: "aprobar", hace: 4 },
    ],
  },
  // Rechazó el presupuesto y lo retiró: esa entrega no da garantía. Volvió con otra falla.
  {
    equipo: "EQ-0012", falla: "La pantalla parpadea", ingresoHace: 30,
    diagnostico: { texto: "Flex de pantalla dañado. Conviene cambiar la pantalla.", servicios: ["pantalla_celular"], repuestos: [{ descripcion: "Pantalla Galaxy A14", precio: 32000 }] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 29 }, { accion: "enviar_presupuesto", hace: 29 },
      { accion: "rechazar", hace: 27 }, { accion: "entregar", hace: 25 },
    ],
  },
  { equipo: "EQ-0012", falla: "No reconoce el chip", ingresoHace: 1, pasos: [] },
  {
    equipo: "EQ-0013", falla: "Tarda mucho en arrancar y se congela", ingresoHace: 4,
    diagnostico: { texto: "Disco lento y sistema con errores. Conviene SSD y formateo.", servicios: ["ssd", "formateo"], repuestos: [{ descripcion: "SSD 512 GB", precio: 31000 }] },
    pasos: [{ accion: "iniciar_diagnostico", hace: 3 }, { accion: "enviar_presupuesto", hace: 2 }],
  },
  {
    equipo: "EQ-0014", falla: "La bisagra derecha se cortó", ingresoHace: 11,
    diagnostico: { texto: "Bisagra derecha rota y anclaje de la tapa suelto.", servicios: ["bisagra"], repuestos: [{ descripcion: "Bisagra Aspire 5 (par)", precio: 16000 }] },
    pasos: [
      { accion: "iniciar_diagnostico", hace: 10 }, { accion: "enviar_presupuesto", hace: 10 },
      { accion: "aprobar", hace: 9 }, { accion: "esperar_repuesto", hace: 9 },
    ],
  },
];

export function crearSemilla(hoy: Fecha): DatosTaller {
  let d = datosVacios();
  // Las órdenes se abren en orden de fecha, así los códigos OT quedan cronológicos.
  const porFecha = [...ORDENES].sort((a, b) => b.ingresoHace - a.ingresoHace);
  for (const [i, e] of EQUIPOS.entries()) {
    // El equipo ingresó con su orden más antigua.
    const id = `EQ-${String(i + 1).padStart(4, "0")}`;
    const primerIngreso = Math.max(0, ...ORDENES.filter((o) => o.equipo === id).map((o) => o.ingresoHace));
    d = ok(crearEquipo(d, e, sumarDias(hoy, -primerIngreso))).datos;
  }
  for (const o of porFecha) {
    const abierta = ok(abrirOrden(d, o.equipo, o.falla, sumarDias(hoy, -o.ingresoHace)));
    d = abierta.datos;
    const id = abierta.orden.id;
    for (const paso of o.pasos) {
      d = ok(aplicarAccion(d, id, paso.accion, sumarDias(hoy, -paso.hace))).datos;
      if (paso.accion === "iniciar_diagnostico" && o.diagnostico) {
        d = ok(
          cargarDiagnostico(d, id, {
            diagnostico: o.diagnostico.texto,
            servicioIds: o.diagnostico.servicios,
            repuestos: o.diagnostico.repuestos ?? [],
          }),
        ).datos;
      }
    }
  }
  return d;
}
