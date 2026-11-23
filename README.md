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
- El catálogo de servicios arranca con los 10 servicios de ejemplo del encargo (pesos chilenos, mano
  de obra) y se puede editar en la pantalla **Catálogo**. Los cambios quedan en este navegador. Los
  repuestos se cargan aparte, con precio libre. La garantía es de 90 días.

## Cómo se preparan los datos sintéticos

Al abrir la app por primera vez, si no existe la clave propia `servielectronica-ot:datos-v2` en
`localStorage`, se carga la semilla de `src/datos/semilla.ts`: **14 equipos de los cuatro tipos, 18
órdenes con los ocho estados presentes y el catálogo inicial**. Si la clave ya existe, la semilla no
se vuelve a cargar y se usan los datos guardados.

| Estado | Órdenes |
|---|---|
| Ingresado | 2 |
| En diagnóstico | 2 |
| Esperando aprobación | 2 |
| En reparación | 2 |
| Esperando repuesto | 2 |
| Lista para retirar | 3 |
| Entregado | 3 |
| Sin reparación | 2 |
| **Total** | **18** |

Hay 5 notebooks, 2 PC, 5 celulares y 2 tablets (14 equipos). Algunos equipos tienen historial: una
orden cerrada vieja y otra abierta ahora, para que se vea cómo el historial decide la garantía.

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
| EQ-0007 Notebook Dell Inspiron 15 | Entregado hace 120 días (sin garantía) y de vuelta En diagnóstico |
| EQ-0008 Celular Apple iPhone 11 | Ingresado hoy |
| EQ-0009 Notebook Asus VivoBook 15 | En diagnóstico (se puede cargar el diagnóstico) |
| EQ-0010 Celular Xiaomi Redmi Note 12 | Sin reparación hace 20 días; volvió y está Lista para retirar |
| EQ-0011 Tablet Lenovo Tab M10 HD | Sin reparación hace 150 días; ahora En reparación |
| EQ-0012 Celular Samsung Galaxy A14 | Rechazó y retiró hace 25 días (**esa entrega no da garantía**); ahora Ingresado |
| EQ-0013 PC HP All-in-One 24 | Esperando aprobación (SSD y formateo) |
| EQ-0014 Notebook Acer Aspire 5 | Esperando repuesto (bisagra) |

Los códigos de orden son `OT-año-número`, correlativos y sin reutilizar. Como dependen de la fecha,
las guías de abajo nombran el equipo, no el código.

## Cómo reiniciar los datos de ejemplo

Desde la app, sin consola:

1. Entrar a **Ajustes** (en el menú).
2. Tocar **Restaurar datos de prueba** y confirmar con **Sí, restaurar**.
3. Aparece «Datos de prueba restaurados: 14 equipos, 18 órdenes y el catálogo inicial». Se borra
   todo lo cargado en ese navegador, incluidos los cambios del catálogo.

También vale abrir la app en una ventana de incógnito, que siempre arranca con los datos de ejemplo.

## Cómo comprobar los criterios de aceptación

Partir de los datos recién cargados y entrar con la clave `mostrador2026`. Lo más simple es abrir la
app en una ventana de incógnito (Ctrl + Shift + N en Chrome), que siempre arranca con los datos de
ejemplo, o tocar **Ajustes → Restaurar datos de prueba**. Todo se puede probar en un celular de 360
px o en escritorio.

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
     equipo, no hubo trabajo reparado y por eso no hay garantía. La ficha del **Samsung Galaxy A14**
     lo muestra en pantalla: «Sin garantía: la última entrega (OT-…) fue sin reparación porque el
     cliente rechazó el presupuesto». Ver «Decisiones tomadas» más abajo.
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

   La semilla tiene órdenes en los ocho estados: en la mesa, el filtro **Estado** lleva directo a
   cada una (por ejemplo, Entregado o Sin reparación para ver las órdenes cerradas).
7. **Filtros combinados.** En la mesa, sin filtros el contador dice «18 órdenes». Con Tipo
   **Notebook** dice «6 órdenes»; sumando Días **Más de 30 días** dice «2 órdenes»; sumando Estado
   **Lista para retirar** dice «1 orden» (la HP). En cada paso el contador coincide con las tarjetas
   que se ven. «Quitar filtros» vuelve a las 18.
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

### Cambios pedidos en la revisión

10. **Catálogo: alta, edición y pausa.** En **Catálogo** (menú), arriba dice «10 servicios · 10
    activos».
    - **Alta:** tocar **Nuevo servicio**, completar nombre, al menos un tipo de equipo, precio y días,
      y tocar **Agregar servicio**. Aparece en la lista como **Activo** y el contador pasa a 11. Si
      falta cualquiera de los cuatro datos, no se guarda, avisa qué falta y lo escrito queda en el
      formulario.
    - **Edición:** en cualquier servicio, **Editar**, cambiar el precio y **Guardar cambios**. La
      tarjeta muestra el precio nuevo. Las órdenes que ya existen conservan el precio que tenían.
    - **Pausa:** **Pausar** en «Cambio de batería de celular». La tarjeta pasa a **Pausado** y ese
      servicio deja de ofrecerse al cargar un diagnóstico (probarlo con la orden del iPhone 11:
      «Pasar a diagnóstico»). **Reactivar** lo vuelve a ofrecer.
    - El **Diagnóstico general** se puede editar, pero no pausar ni borrar, porque toda orden lo usa.
11. **No se borra un servicio con órdenes abiertas.** La tarjeta de «Cambio de pin de carga de
    celular» dice «En 1 orden abierta: OT-…» (la del Galaxy A54). Al tocar **Borrar**, la tarjeta
    avisa «No se puede borrar … está en la orden abierta OT-…» y el servicio sigue en la lista. En
    cambio, «Recuperación de datos básica» solo está en órdenes cerradas: **Borrar** pide confirmación
    y, con **Sí, borrar**, sale del catálogo (las órdenes cerradas conservan su línea).
12. **Ajustes y «Restaurar datos de prueba».** Ver «Cómo reiniciar los datos de ejemplo». Ajustes
    también muestra los parámetros vigentes: valor del diagnóstico, días de garantía y de retiro
    atrasado.
13. **Datos iniciales.** 14 equipos de los cuatro tipos y 18 órdenes en los ocho estados (ver la
    tabla de «Cómo se preparan los datos sintéticos»). Se comprueba en la mesa con el filtro Estado.
14. **Reglas y pruebas.** Ver la sección siguiente.

## Reglas y pruebas

### Reglas que aplica la app

- La orden siempre cuelga de un equipo identificado por su serie o IMEI, que no se puede repetir.
- Un equipo tiene como máximo una orden abierta (cualquier estado salvo Entregado y Sin reparación).
- Desde cada estado solo se ofrecen los pasos de la tabla del criterio 6.
- Al aprobar, el diagnóstico se descuenta del total. Al rechazar, el total queda en el diagnóstico,
  sin repuestos consumidos ni trabajo reparado.
- Garantía: una orden nueva sobre un equipo **entregado con reparación** hace 90 días o menos va en
  garantía. La mano de obra (diagnóstico y servicios) va en cero y los repuestos se cobran.
- Retiro atrasado: más de 30 días en Lista para retirar.
- Código de orden: `OT-año-número`, correlativo y sin reutilizar.
- Cada orden guarda el precio del diagnóstico y de cada servicio que tenía al cargarse, así que
  editar el catálogo no cambia los totales de las órdenes existentes.

### Cómo modificar los parámetros

| Parámetro | Desde la app | En el código |
|---|---|---|
| **Catálogo** (servicios, precios, días, tipos) | **Catálogo**: Nuevo servicio, Editar, Pausar o Borrar | Catálogo inicial (el que carga la semilla): `CATALOGO_INICIAL` en `src/dominio/modelo.ts` |
| **Valor del diagnóstico** | **Catálogo** → «Diagnóstico general» → **Editar** → precio | El `precio` del servicio `diagnostico` en `CATALOGO_INICIAL` (`src/dominio/modelo.ts`) |
| **Días de garantía** | Se ven en **Ajustes** | `DIAS_GARANTIA` en `src/dominio/modelo.ts` (hoy `90`) |
| **Días para «Retiro atrasado»** | Se ven en **Ajustes** | `DIAS_RETIRO_ATRASADO` en `src/dominio/modelo.ts` (hoy `30`) |
| **Clave del panel** | — | `CLAVE_PANEL` en `src/ui/sesion.ts` (ver «Cómo cambiar la clave del panel») |

- Los cambios hechos desde la app se guardan en ese navegador y se pierden al restaurar los datos de
  prueba.
- Los cambios en el código valen para todos: editar el valor, correr `npm run verificar` y publicar
  con un `git push` a `main`. Si se cambia el catálogo inicial, para verlo en un navegador que ya usó
  la app hay que tocar **Ajustes → Restaurar datos de prueba**.
- Si se cambian `DIAS_GARANTIA` o `DIAS_RETIRO_ATRASADO`, algunos tests comprueban los valores
  actuales (por ejemplo, 90 días sí y 91 no) y hay que ajustarlos al valor nuevo.

### Pruebas automatizadas

```bash
npm test            # corre todas las pruebas
npm run verificar   # borra el caché, compila y corre las pruebas (lo mismo que hace la publicación)
```

| Archivo | Qué prueba |
|---|---|
| `src/test/dominio.test.ts` | Reglas: serie única, una orden abierta, aprobación y rechazo, garantía (90 días sí, 91 no), retiro atrasado (30 no, 31 sí), tabla de pasos y filtros |
| `src/test/catalogo.test.ts` | Catálogo: atributos obligatorios, nombre repetido, precios congelados al editar, pausa, borrado bloqueado con órdenes abiertas |
| `src/test/datos.test.tsx` | Semilla (14 equipos, 18 órdenes, los ocho estados), guardado en `localStorage` y que un fallo al guardar no cambie nada |
| `src/test/pantallas.test.tsx` | Criterios 1 a 8 usados desde la pantalla, incluida la prueba guiada |
| `src/test/catalogo-ajustes.test.tsx` | Pantallas Catálogo y Ajustes: alta, edición, pausa, borrado y «Restaurar datos de prueba» |

**Prueba guiada** («cierre rechazado sin falsa reparación»): está automatizada en
`src/test/dominio.test.ts` y `src/test/pantallas.test.tsx`, y se repite a mano siguiendo el criterio
8 de arriba.

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

- `src/dominio/`: modelo y parámetros (`modelo.ts`), reglas, acciones de órdenes y del catálogo
  (`catalogo.ts`). Es puro, sin React ni `localStorage`.
- `src/datos/`: guardado en `localStorage`, semilla y contexto que guarda antes de mostrar éxito.
- `src/pages/` y `src/ui/`: las siete pantallas (Acceso, Mesa, Alta de equipo, Ficha del equipo,
  Detalle de orden, Catálogo y Ajustes) y sus piezas.
