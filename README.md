<div align="center">

# 🥩 Carnitas Estilo Clay · App

**Sistema de punto de venta y control financiero para negocio de carnitas de fin de semana**

Captura ventas, insumos, gastos y sueldos desde el celular, sin servidor ni costos de hosting, sincronizado directo a Google Sheets.

[![Versión](https://img.shields.io/badge/versión-2.6.0-E36414)]()
[![Static Site](https://img.shields.io/badge/hosting-GitHub%20Pages-24292e?logo=github)](https://pages.github.com/)
[![No Build](https://img.shields.io/badge/build-none-brightgreen)]()
[![Backend](https://img.shields.io/badge/backend-Google%20Sheets%20%2B%20Apps%20Script-34A853?logo=googlesheets&logoColor=white)]()
[![Licencia](https://img.shields.io/badge/uso-privado-lightgrey)]()

</div>

---

## 📱 Qué hace

Carnitas App reemplazó una hoja de cálculo manual y una app de terceros como sistema de captura del negocio. Corre como una **PWA** (Progressive Web App): se instala en la pantalla de inicio del celular y se siente como una app nativa, pero es solo un archivo HTML.

<table>
<tr>
<td width="20%" align="center">🥩<br><b>Ventas</b><br><sub>Captura por categoría, en kilos, gramos, monto o piezas</sub></td>
<td width="20%" align="center">🛒<br><b>Insumos</b><br><sub>Compras de carne y materia prima, por categoría</sub></td>
<td width="20%" align="center">🧾<br><b>Gastos</b><br><sub>Gastos del día a día</sub></td>
<td width="20%" align="center">👷<br><b>Sueldos</b><br><sub>Pagos a ayudantes por turno</sub></td>
<td width="20%" align="center">📊<br><b>Ventas</b><br><sub>Por día o por semana, con margen</sub></td>
</tr>
</table>

**Cotizaciones para eventos** (v2.4): se cotiza por persona con paquete y extras, con IVA opcional si el cliente pide factura. Cada cotización recibe folio `COT-AA-####`, pasa por Borrador → Enviada → Confirmada (anticipo de 50%) → Liquidada → Convertida en venta, y se puede marcar como Rechazada con motivo. El margen estimado solo se ve en la app. Se guarda en la pestaña `Cotizaciones`.

**Planear la semana** (v2.6, antes *Asuetos y pronóstico*): calcula la venta esperada del fin de semana y el **pedido sugerido de carne cruda**. El pedido es igual a los kilos a vender multiplicados por los kilos crudos que realmente compras por cada kilo vendido. Ese factor es la mediana de 8 semanas y descuenta la carne que sobró. El calendario de **fechas atípicas** (pestaña `Asuetos`) marca cada fecha como ▼ baja, ▲ sube o ? por confirmar, y le da dos impactos: el que dicen tus datos y el que decides tú, que es el que se usa. Después del fin de semana, la app te pide confirmar si la próxima vez usas lo que realmente pasó. El calendario se puede precargar con los festivos de la LFT, Semana Santa, las fechas publicadas de la SEP y de San Luis Potosí, y fechas comerciales como el Día de las Madres y el Día del Padre. Tus fechas propias pueden repetirse cada año. El **cierre del domingo** registra la carne cocida que sobró en la pestaña `Cierres`. El apartado también compara cada fecha contra la misma del año anterior.

La app usa la identidad de **Carnitas Estilo Clay**: paleta «Cobre y Noche» (Naranja Cazo `#E36414`, Azul Noche `#1B263B`, Ámbar `#F2A541`, Manteca `#FFF8F0`, Cobre `#B84A00`), letras Kanit y Archivo, y el escudo de la marca como ícono.

Además incluye un **tablero ejecutivo** (`carnitasdashboard.html`) para revisar el negocio por semana o por mes desde la computadora.

---

## ✨ Características

**Captura**
- **Selector de modo** para productos por peso: *Kilos · Gramos · Monto* en Carne y Tortillas, *Gramos · Monto* en Chicharrón
- **Precios por kilo, medio y cuarto** desde la pestaña `Precios`, visibles en cada botón: ¾ = medio + cuarto, 1¼ = kilo + cuarto, 1½ = kilo + medio (gramos y monto se calculan con el precio del kilo)
- **Piezas** para Gorditas, Tacos, Frijoles charros, Bebida y Torta, con el campo vacío y teclado numérico (sin un "1" que borrar)
- **Pollo** entero o medio (botones Medio · 1 · 1½ · 2 u otra cantidad)
- **Surtido** como un producto más: se guarda en un solo renglón con lo que se cobró (kilos, gramos o monto), sin repartos estimados entre cortes
- **Ticket en vivo** con ✕ para quitar productos antes de cobrar
- **Tacos regalados** por ticket (opcional, vacío cuenta como cero)
- **Venta perdida** por categoría: en kilos (¼, ½, ¾, 1 kg), piezas o monto, según el tipo de producto
- **Cobro según el método de pago**
  - *Efectivo*: "¿con cuánto paga?" con billetes sugeridos y cálculo del cambio; no deja registrar si el pago no cubre el total
  - *Tarjeta*: se registra al tocarla
  - *Transferencia*: muestra los datos de la cuenta con la CLABE en grande y agrupada para dictarla fácil; se registra hasta confirmar que llegó
- **Botón 🏦 Datos para transferencia** para mostrar la cuenta en cualquier momento, sin perder el ticket en curso

**Diseño**
- Funciona en **horizontal y vertical**: en horizontal el ticket va a un lado; en vertical baja a una barra fija con total y botón Cobrar, que se despliega al tocarla
- Respeta la muesca y las orillas del iPhone en ambas orientaciones

**Confiabilidad**
- **Todo se guarda primero en el celular** y luego se envía a la hoja. Sin señal, las capturas se quedan en cola y se reenvían solas al volver la conexión
- **Sin ventas duplicadas**: cada envío lleva un identificador único; si se reintenta un envío que ya había llegado, la hoja lo ignora
- **Sin esperas infinitas**: toda consulta tiene tiempo límite; si el servicio no responde, la app sigue funcionando con los últimos datos guardados
- **Sin inicio de sesión con Google**: la app habla con la hoja a través de un servicio de Apps Script protegido con clave

**Ventas en la app: Día | Semana**
- *Día*: venta total, tickets, ticket promedio, kilos de carne, comparación contra el mismo día de la semana anterior, venta por hora, categorías, método de pago y efectivo esperado en caja
- *Semana* (viernes a jueves): venta, utilidad, margen y tickets contra la semana anterior; cascada de la venta a la utilidad; sábado vs domingo con hora pico; categorías; productos principales; cobro; costos de la semana
- Aviso de costos incompletos cuando hay ventas sin insumos capturados

**Tablero ejecutivo**
- **Semana del negocio: viernes a jueves.** Las ventas de sábado y domingo se cruzan con los insumos, gastos y sueldos de esos 7 días; los periodos siempre son semanas completas
- Filtros: *Semana* (con flechas), *Últimas 4 semanas*, *Mes* (semanas cuyo sábado cae en el mes), *Todo* y *Personalizado*
- **Utilidad = ventas − carne − otros insumos − gastos − sueldos**, con margen y promedio de 4 semanas
- **Qué revisar en cada pestaña**: hasta 5 alertas ordenadas de lo más grave (▼) a lo positivo (▲), con umbrales configurables en `UMBRAL`
- *Resumen*: KPIs, alertas principales de todas las pestañas, venta y utilidad por semana con margen, cascada de la venta a la utilidad, mezcla por categoría, sábado vs domingo, cobro
- *Ventas*: mapa de calor día × hora, venta por hora, ranking de productos con regla 80/20, productos por ticket, tickets más grandes, ventas perdidas
- *Costos*: costo por semana, estado de resultados, evolución del precio por kilo por corte, compras por proveedor, costo de carne por kilo vendido, rendimiento, punto de equilibrio semanal, gastos y nómina
- *Datos*: **selector de tabla** (Ventas, Insumos, Gastos, Sueldos, Ventas perdidas) con indicadores y renglones marcados (`¿dup?`, `¿doble?`, `¿hora?`); alertas de captura (duplicados, doble cobro, ventas fuera de horario o en días no operativos, servicio desactualizado); calidad del histórico y descarga CSV de cualquier tabla
- **Clic para filtrar** por categoría o producto; botón de **tema claro/oscuro** que se recuerda
- Lee en vivo del servicio o de un Excel descargado de la hoja

---

## 🗂️ Categorías

<table>
<tr>
<td valign="top" width="50%">

**Insumos**
| | |
|---|---|
| Carne | Verdura/Salsa |
| Bebidas | Cerveza |
| Desechables | Oxxo |
| Masa | Tortillas |
| Gas | Luz |
| Renta | Agua |
| Internet | Super |
| Otros | |

</td>
<td valign="top" width="50%">

**Gastos**
| |
|---|
| Oxxo |
| Comida |
| Postres |
| Otros |

</td>
</tr>
</table>

> `Oxxo` aparece en ambas secciones a propósito: en **Insumos** es una compra para el negocio (hielo, servilletas); en **Gastos** es consumo personal. Se reportan por separado.

---

## 🧱 Arquitectura

```
carnitas-app/
├── index.html              ← la app (HTML + CSS + JavaScript en un solo archivo)
├── carnitasdashboard.html  ← tablero ejecutivo
├── manifest.json           ← instalación como app en el celular
├── icon.png
├── logo_c.png              ← logo del encabezado
├── icons/                  ← íconos propios (sprite SVG + CSS + guía ICONOS.md)
└── Code.gs                 ← servicio de Google Apps Script (se pega en la hoja, no corre en GitHub)
```

```
 Celular (PWA)  ──┐                     ┌──> Google Sheets
                  ├──> Apps Script ─────┤    Ventas · Insumos · Gastos
 Tablero (web) ───┘    (clave de acceso)└──> Sueldos · VentasPerdidas · Precios
```

- **Sin frameworks, sin npm, sin build**: se edita y se sube directo
- **Google Apps Script** como servicio web: escribe y lee la hoja con permisos del dueño, así que la app no necesita iniciar sesión
- La clave vive en las propiedades del script, **nunca en el código** del repositorio
- Los datos bancarios viven en la pestaña `Cuenta` de la hoja, **nunca en el código**
- Las pestañas se crean solas la primera vez que se captura algo en cada una; si una pestaña existente tiene menos columnas, se agregan al final sin mover las actuales

### Hojas de Google

| Pestaña | Columnas |
|---|---|
| Ventas | Fecha · Ticket · Categoría · Producto · Modo · Cantidad · Precio unitario · Total · Método de pago |
| Insumos | Fecha · Categoría · Producto · Cantidad · Tipo · Precio unitario · Costo total · Proveedor |
| Gastos | Fecha · Categoría · Descripción · Monto · Proveedor |
| Sueldos | Fecha · Nombre · Puesto · Días trabajados · Monto pagado |
| VentasPerdidas | Fecha · Categoría · Kilos estimados · Motivo · Monto estimado · Piezas estimadas |
| Precios | Producto · Precio · Precio medio · Precio cuarto |
| Cuenta | Campo · Valor (CLABE, beneficiario, institución, celular) |
| Cotizaciones | Un renglón por cotización (folio, cliente, evento, importes, pagos y estado) |
| Asuetos | Fecha inicio · Fecha fin · Nombre · Tipo · Impacto estimado (%) · Considerar · Notas · ID · Actualizado · Efecto · Repetir · Fuente · Real (%) · Revisado |
| Cierres | Fecha · Carne sobrante (kg) · Notas |

---

## 🚀 Despliegue

La app vive en GitHub Pages:

```
https://migueloted3v.github.io/carnitas-app/
https://migueloted3v.github.io/carnitas-app/carnitasdashboard.html
```

### Primera configuración
1. En la hoja de Google: **Extensiones → Apps Script**, pega `Code.gs`, ejecuta `crearClave()` y publícalo como **Aplicación web**
2. En la app: **⚙ Ajustes** → pega la URL del servicio y la clave → **Guardar y probar conexión**
3. En **⚙ Ajustes**: *Configurar precios de medio y cuarto* y *Crear pestaña Cuenta*
4. Llena la pestaña `Cuenta` en la hoja, ajusta `Precios` si hace falta y toca **Sincronizar precios y cuenta**

---

## 🔒 Datos

Todo vive en **tu** Google Drive. La app no tiene servidor propio ni guarda tus datos en ningún otro lugar. En el celular solo se guarda la configuración, los precios y las capturas pendientes de enviar cuando no hay internet.

---

## 📝 Historial de versiones

| Versión | Cambios |
|---|---|
| **2.6.0** | **Planear la semana**: pedido sugerido de carne cruda con el factor real de compra contra venta (descuenta lo que sobró), venta esperada con rango y comparación con hace un año · fechas atípicas con efecto ▼/▲/?, impacto de tus datos contra el tuyo y aviso para revisar después del fin de semana · fechas propias que se repiten cada año · precarga ampliada (SEP 2025-2026, FENAPO, Xantolo, Día del Maestro de Primaria SLP, regreso a clases, Día de las Madres y Día del Padre) · cierre del domingo con la carne sobrante (pestaña `Cierres`) · pestaña Histórico con compra contra venta · servicio: `semanal` trae kilos comprados y sobrantes |
| **2.5.0** | Apartado **Asuetos y pronóstico**: pestaña `Asuetos` con alta/edición/borrado y precarga de festivos de México (con su puente) · pronóstico semanal de venta y kilos de carne ajustado por asueto (impacto capturado, histórico del mismo asueto o promedio de asuetos, con encogimiento hacia 0% cuando hay pocos datos) · tabla de asuetos pasados vs. fin de semana normal · aviso de semana de asueto en la vista Semana · servicio: acciones `asuetos`, `semanal` y `guardarAsuetos` · ícono `icon-asuetos` |
| **2.4.2** | Íconos propios estilo Clay (`icons/icons.svg`): insignia en el menú principal, ícono del módulo en el encabezado y en *Nueva cotización*; 5 íconos de apoyo (venta perdida, transferencia, efectivo, tarjeta, ajustes). Ya no quedan emojis en la app. Los colores del set toman la paleta oficial de la app |
| **2.3.0** | Surtido se guarda en un solo renglón (sin reparto por porcentajes) · servicio: `ajustarZonaHoraria()`, `revisarSurtido()` y `consolidarSurtido()` para juntar el histórico, y `ping`/`todo` informan la zona horaria · tablero: alertas *Qué revisar* en las 4 pestañas, selector de tablas en *Datos*, aviso si el servicio está desactualizado, Surtido repartido se agrupa al mostrarlo · app: aviso en Ajustes si la hoja no está en hora de México |
| **2.2.1** | Servicio: las fechas se leen con la zona horaria de la propia hoja; corrige insumos capturados a mano que caían en la semana anterior y horas de venta recorridas 6 horas · acepta fechas escritas como texto (25/09/2026) |
| **2.2.0** | Semana del negocio de viernes a jueves en tablero y app · margen con gastos incluidos · vista *Semana* en la app · tablero con tema claro/oscuro, clic para filtrar, *Qué revisar*, mapa de calor, ranking 80/20, evolución del precio por kilo, compras por proveedor y punto de equilibrio · nueva acción `rango` en el servicio |
| **2.1.1** | Se quita el código QR (las cámaras no copian texto simple); la CLABE se muestra más grande y agrupada en bloques · el aviso de versiones distintas solo compara MAYOR.MENOR |
| **2.1.0** | Categoría Pollo (entero o medio) · precios por kilo, medio y cuarto desde la hoja, visibles en cada botón · cobro en efectivo con cálculo de cambio · cobro por transferencia con datos de cuenta · botón 🏦 para mostrar la cuenta sin perder el ticket · pestaña `Cuenta` · categorías en cuadrícula de 3 (vertical) y 5 (horizontal) |
| **2.0.0** | Servicio de Apps Script en lugar de inicio de sesión con Google · cola de envío con reintento y sin duplicados · selector Kilos/Gramos/Monto · chicharrón por monto · piezas sin valor precargado · venta perdida por categoría · diseño horizontal y vertical con barra de ticket · vista *Venta del día* · tablero ejecutivo nuevo · corrección de fecha después de las 6 p. m. · el Surtido cuadra exacto con lo cobrado |
| 1.x | Captura de ventas, insumos, gastos y sueldos; Surtido; tacos regalados; ventas perdidas por corte |

---

<div align="center">
<sub>Construido para un negocio de carnitas que abre sábado y domingo 🌮</sub>
</div>
