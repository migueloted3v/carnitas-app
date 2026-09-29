<div align="center">

# 🥩 Carnitas App

**Sistema de punto de venta y control financiero para negocio de carnitas de fin de semana**

Captura ventas, insumos, gastos y sueldos desde el celular, sin servidor ni costos de hosting, sincronizado directo a Google Sheets.

[![Versión](https://img.shields.io/badge/versión-2.1.1-F85E00)]()
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
<td width="20%" align="center">📊<br><b>Venta del día</b><br><sub>Resumen en vivo de cualquier fecha</sub></td>
</tr>
</table>

Además incluye un **tablero ejecutivo** (`carnitasdashboard.html`) para revisar el negocio por semana o por mes desde la computadora.

---

## ✨ Características

**Captura**
- **Selector de modo** para productos por peso: *Kilos · Gramos · Monto* en Carne y Tortillas, *Gramos · Monto* en Chicharrón
- **Precios por kilo, medio y cuarto** desde la pestaña `Precios`, visibles en cada botón: ¾ = medio + cuarto, 1¼ = kilo + cuarto, 1½ = kilo + medio (gramos y monto se calculan con el precio del kilo)
- **Piezas** para Gorditas, Tacos, Frijoles charros, Bebida y Torta, con el campo vacío y teclado numérico (sin un "1" que borrar)
- **Pollo** entero o medio (botones Medio · 1 · 1½ · 2 u otra cantidad)
- **Surtido** con reparto automático entre cortes según lo comprado en las últimas 8 semanas; el redondeo se ajusta para que la suma cuadre exacto con lo cobrado
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

**Venta del día**
- Venta total, tickets, ticket promedio y kilos de carne vendidos
- Comparación contra el mismo día de la semana anterior
- Venta por hora, mezcla por categoría, método de pago y efectivo esperado en caja
- Navegación por día, accesos rápidos a *Hoy* y *Ayer*, y selector de fecha

**Tablero ejecutivo**
- Periodos por semana de lunes a domingo, para que las compras del viernes caigan en la misma semana que las ventas del fin de semana
- Pestañas: *Resumen*, *Ventas*, *Costos* y *Datos*
- Estado de resultados, rendimiento de la carne (vendida contra comprada en crudo) y costo por kilo por corte
- Aviso cuando un periodo tiene ventas pero no costos capturados
- Lee en vivo del servicio o de un Excel descargado de la hoja; modo claro y oscuro automático

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
| **2.1.1** | Se quita el código QR (las cámaras no copian texto simple); la CLABE se muestra más grande y agrupada en bloques · el aviso de versiones distintas solo compara MAYOR.MENOR |
| **2.1.0** | Categoría Pollo (entero o medio) · precios por kilo, medio y cuarto desde la hoja, visibles en cada botón · cobro en efectivo con cálculo de cambio · cobro por transferencia con datos de cuenta · botón 🏦 para mostrar la cuenta sin perder el ticket · pestaña `Cuenta` · categorías en cuadrícula de 3 (vertical) y 5 (horizontal) |
| **2.0.0** | Servicio de Apps Script en lugar de inicio de sesión con Google · cola de envío con reintento y sin duplicados · selector Kilos/Gramos/Monto · chicharrón por monto · piezas sin valor precargado · venta perdida por categoría · diseño horizontal y vertical con barra de ticket · vista *Venta del día* · tablero ejecutivo nuevo · corrección de fecha después de las 6 p. m. · el Surtido cuadra exacto con lo cobrado |
| 1.x | Captura de ventas, insumos, gastos y sueldos; Surtido; tacos regalados; ventas perdidas por corte |

---

<div align="center">
<sub>Construido para un negocio de carnitas que abre sábado y domingo 🌮</sub>
</div>
