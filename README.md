# Órdenes de trabajo — Servielectronica

App interna del mostrador de Servielectronica, un taller chico de notebooks, PC, celulares y
tablets. Registra cada equipo que entra (por su número de serie o IMEI), sigue su orden de trabajo
hasta la entrega y usa el historial del equipo para decidir la garantía.

**App publicada:** https://marialopezmkt.github.io/ordenes-taller-servielectronica/
**Clave del panel:** `mostrador2026`

## Cómo arrancarlo en tu computadora

Hace falta tener [Node.js](https://nodejs.org/) instalado (versión 20 o superior).

```bash
npm install
npm run dev
```

Esto abre la app en `http://localhost:5173/ordenes-taller-servielectronica/`. Entrá con la clave
`mostrador2026`.

Para probar la versión compilada, igual a la publicada:

```bash
npm run build
npm run preview
```

Para validar en limpio (borra el caché, compila y corre las pruebas):

```bash
npm run verificar
```

## Cómo cambiar la clave del panel

La clave está escrita en el código, en `src/ui/sesion.ts`:

```ts
export const CLAVE_PANEL = "mostrador2026";
```

Cambiá ese valor y volvé a publicar (un `git push` a `main` dispara la publicación). **Es un acceso
local de demostración, sin verificación de identidad:** la clave viaja dentro de la app publicada y
cualquiera que lea el código puede verla. No reemplaza un inicio de sesión real.

## Qué está simulado y qué no

**Todo acá es una demostración.** No hay backend ni base de datos, no se envía ningún correo,
WhatsApp ni aviso, y no hay pagos:

- Los equipos y las órdenes se guardan únicamente en el `localStorage` del navegador de quien usa la
  app. Otro navegador u otro dispositivo ven sus propios datos: no hay sincronización.
- Guardar no contacta al cliente ni al negocio. El taller avisa por su cuenta y la app solo deja
  registro (cada formulario y cada confirmación lo recuerdan).
- Cada acción se guarda como un cambio completo de los datos. Si el navegador no deja guardar, la
  app avisa, conserva lo escrito y no cambia estados, totales ni correlativos.
- La sesión dura mientras la pestaña esté abierta (`sessionStorage`). «Salir» la cierra.
- El catálogo de servicios, los precios (pesos chilenos, mano de obra) y la garantía de 90 días son
  los de ejemplo del encargo. Los repuestos se cargan aparte, con precio libre.

## Cómo se preparan los datos sintéticos

Al abrir la app por primera vez, si no existe la clave propia `servielectronica-ot:datos` en
`localStorage`, se carga la semilla de `src/datos/semilla.ts`: **10 equipos y 10 órdenes**. Si la
clave ya existe, la semilla no se vuelve a cargar y se usan los datos guardados.

- Las personas y los teléfonos son inventados (nombre con inicial y números `+56 9 5555 01xx`).
- La semilla se arma con las mismas acciones de la app (alta, abrir orden, diagnóstico, pasos), así
  que nunca contradice las reglas.
- **Las fechas son relativas al día en que se abre la app.** Por eso la garantía y el retiro
  atrasado se ven siempre, se revise el día que se revise.

| Equipo | Situación al cargar la semilla |
|---|---|
| EQ-0001 Notebook Lenovo IdeaPad 3 (serie `PF3K9QZL`) | El caso del encargo: Lista para retirar desde hace 1 día |
| EQ-0002 Celular Samsung Galaxy A54 | **Esperando aprobación** (para la prueba guiada). Total del presupuesto: CLP $36.000 |
| EQ-0003 Notebook HP 14-dq2 | Rechazó hace 35 días y no la retiró: **Retiro atrasado** |
| EQ-0004 Celular Motorola Moto G32 | Entregado hace 60 días: **garantía vigente** (quedan 30 días) |
| EQ-0005 PC Armada Torre Ryzen 5 | En reparación (orden abierta) |
| EQ-0006 Tablet Samsung Galaxy Tab A8 | Esperando repuesto |
| EQ-0007 Notebook Dell Inspiron 15 | Entregado hace 120 días: sin garantía |
| EQ-0008 Celular Apple iPhone 11 | Ingresado hoy |
| EQ-0009 Notebook Asus VivoBook 15 | En diagnóstico (se puede cargar el diagnóstico) |
| EQ-0010 Celular Xiaomi Redmi Note 12 | Sin reparación (estado final) |

Los códigos de orden son `OT-año-número`, correlativos y sin reutilizar. Como dependen de la fecha,
las guías de abajo nombran el equipo, no el código.

## Cómo reiniciar los datos de ejemplo

1. Abrir la app en el navegador.
2. Abrir las herramientas de desarrollador (F12) → pestaña **Console**.
3. Ejecutar:
   ```js
   localStorage.removeItem("servielectronica-ot:datos");
   ```
4. Recargar la página. Se vuelve a cargar la semilla.

## Cómo comprobar los criterios de aceptación

Partir de los datos recién cargados y entrar con la clave `mostrador2026`. Lo más simple es abrir la
app en una ventana de incógnito (Ctrl + Shift + N en Chrome), que siempre arranca con los datos de
ejemplo; también se pueden reiniciar (ver «Cómo reiniciar los datos de ejemplo»). Todo se puede probar en un celular de 360 px o en escritorio.

1. **Serie o IMEI repetido.** Ir a **Nuevo equipo**, poner la serie `PF3K9QZL` (también vale
   `pf3k-9qzl`: se comparan sin espacios, guiones ni mayúsculas), marca, modelo y nombre, y tocar
   **Guardar equipo**. No se guarda; aparece «La serie … ya está registrada en la ficha EQ-0001
   (Lenovo IdeaPad 3 15ITL6)» y el enlace **Ver la ficha EQ-0001**. Lo escrito queda en el formulario.
2. **Una orden abierta por equipo.** En la mesa, tocar la orden de la **PC Armada Torre Ryzen 5** y
   después el nombre del equipo para ir a su ficha. En «Abrir orden» dice «Este equipo ya tiene la
   orden OT-… abierta» y no hay formulario para abrir otra.
3. **Aprobar o rechazar.** Abrir la orden del **Samsung Galaxy A54**: el total es CLP $36.000
   (diagnóstico CLP $10.000 + pin de carga CLP $20.000 + repuesto CLP $6.000).
   - Con **Aprobó: reparar**, aparece la línea «Descuento del diagnóstico (aprobó) −CLP $10.000» y el
     total pasa a CLP $26.000.
   - Con **Rechazó: a retiro** (sobre datos recién reiniciados), el total queda en CLP $10.000, que
     es el precio del diagnóstico.
4. **Garantía.** Ir a la ficha del **Motorola Moto G32** (desde su orden, tocando el nombre del
   equipo). Dice «En garantía … quedan 30 días» y, sobre el formulario, «La orden nueva entra en
   garantía». Escribir una falla y tocar **Abrir orden**: la orden nueva muestra la etiqueta «En
   garantía», «Diagnóstico (en garantía) CLP $0» y total CLP $0. Si después se pasa a diagnóstico y
   se marca «Cambio de batería de celular» con un repuesto, el servicio figura «(en garantía) CLP $0»
   y solo se cobra el repuesto. Para comparar, la ficha del **Dell Inspiron 15** (entregado hace 120
   días) dice «Sin garantía vigente».
   - **Entrega sin reparación:** si se rechaza el presupuesto de una orden y después se entrega el
     equipo, no hubo trabajo reparado y por eso no hay garantía. La ficha lo explica en pantalla:
     «Sin garantía: la última entrega (OT-…) fue sin reparación porque el cliente rechazó el
     presupuesto». Ver «Decisiones tomadas» más abajo.
5. **Retiro atrasado.** En la mesa, la orden de la **HP 14-dq2** aparece primera, con borde naranja,
   la etiqueta **Retiro atrasado** y «Lista para retirar desde hace 35 días». La del Lenovo, lista
   desde hace 1 día, no la tiene.
6. **Solo los pasos de la tabla.** En cada orden, la sección «Próximo paso» muestra solo los pasos
   permitidos desde su estado:

   | Estado | Botones |
   |---|---|
   | Ingresado | Pasar a diagnóstico |
   | En diagnóstico | Pedir aprobación |
   | Esperando aprobación | Aprobó: reparar · Rechazó: a retiro |
   | En reparación | Esperar repuesto · Reparado: a retiro |
   | Esperando repuesto | Llegó el repuesto |
   | Lista para retirar | Entregar · Sin reparación |
   | Entregado / Sin reparación | Ninguno: dice «Orden cerrada: no hay más pasos» |

   Se puede ver con la Dell o la Motorola (Entregado) y con el Xiaomi (Sin reparación).
7. **Filtros combinados.** En la mesa, sin filtros el contador dice «10 órdenes». Con Tipo
   **Notebook** dice «4 órdenes»; sumando Días **Más de 30 días** dice «2 órdenes»; sumando Estado
   **Lista para retirar** dice «1 orden» (la HP). En cada paso el contador coincide con las tarjetas
   que se ven. «Quitar filtros» vuelve a las 10.
8. **Persistencia, 360 px y prueba guiada.**
   - **Prueba guiada:** abrir la orden del **Samsung Galaxy A54** (Esperando aprobación) y tocar
     **Rechazó: a retiro**. Se ve «Guardado: la orden pasó a Lista para retirar» con el aviso de demo;
     la orden queda **Lista para retirar**, con Presupuesto **Rechazado**, Trabajo reparado **No**,
     Repuestos consumidos **No**, total **CLP $10.000 (solo diagnóstico)** y «Repuestos
     presupuestados que no se usaron: Pin de carga USB-C».
   - **Recarga:** recargar la página (F5). La orden sigue igual.
   - **360 px:** en Chrome, F12 → ícono de celular → ancho 360. Ninguna pantalla se desborda hacia
     los costados y los botones miden al menos 44 px de alto.
   - La prueba automatizada del mismo caso está en `src/test/pantallas.test.tsx` y
     `src/test/dominio.test.ts` («cierre rechazado sin falsa reparación»).
9. **Repositorio y previsualización.** Este repositorio, compartido con partners@kodarvia.com, con la
   app publicada en la URL de arriba.

### Decisiones tomadas donde el encargo no es explícito

- **«El diagnóstico se descuenta del total»:** mientras el cliente decide, el total incluye el
  diagnóstico. Si aprueba, el diagnóstico se bonifica (línea de descuento). Si rechaza, se cobra solo
  el diagnóstico.
- **Qué da garantía:** solo una orden **Entregada con reparación realizada**. Una orden rechazada y
  retirada no da garantía, porque no hubo reparación («cierre rechazado sin falsa reparación»).
- **En garantía, el diagnóstico también es mano de obra** y va en cero. Los repuestos se cobran.
- **«Sin reparación»** no cambia el total que tenía la orden. El encargo no define otro.
- **Días:** el filtro usa la antigüedad desde el ingreso de la orden (hasta 7, de 8 a 30, más de 30).
  «Lista para retirar desde hace N días» y «Retiro atrasado» (más de 30) cuentan desde que la orden
  entró a ese estado.
- **Diagnóstico y presupuesto** se cargan con la orden En diagnóstico. No se puede pedir aprobación
  sin diagnóstico.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4, con React Router (`HashRouter`, para que funcione en
GitHub Pages sin configuración de servidor) y `localStorage` como persistencia. Pruebas con Vitest y
Testing Library. Tipografías IBM Plex Sans Condensed (títulos) e IBM Plex Sans (texto), con
tipografías del sistema de reserva.

```bash
npm test
```

La lógica del taller está separada de las pantallas:

- `src/dominio/`: modelo, estados y transiciones, reglas y acciones. Es puro, sin React ni
  `localStorage`.
- `src/datos/`: guardado en `localStorage`, semilla y contexto que guarda antes de mostrar éxito.
- `src/pages/` y `src/ui/`: las cinco pantallas (Acceso, Mesa, Alta de equipo, Ficha del equipo y
  Detalle de orden) y sus piezas.
