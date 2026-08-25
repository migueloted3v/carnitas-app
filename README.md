<div align="center">

# 🥩 Carnitas App

**Sistema de punto de venta y control financiero para negocio de carnitas de fin de semana**

Captura ventas, insumos, gastos y sueldos desde el celular — sin servidor, sin costos de hosting, sincronizado directo a Google Sheets.

[![Static Site](https://img.shields.io/badge/hosting-GitHub%20Pages-24292e?logo=github)](https://pages.github.com/)
[![No Build](https://img.shields.io/badge/build-none-brightgreen)]()
[![Backend](https://img.shields.io/badge/backend-Google%20Sheets-34A853?logo=googlesheets&logoColor=white)]()
[![Licencia](https://img.shields.io/badge/uso-privado-lightgrey)]()

</div>

---

## 📱 Qué hace

Carnitas App reemplazó una hoja de cálculo manual y una app de terceros como sistema de captura del negocio. Corre como una **PWA** (Progressive Web App): se instala en la pantalla de inicio del celular y se siente como una app nativa, pero es solo un archivo HTML.

<table>
<tr>
<td width="25%" align="center">🥩<br><b>Ventas</b><br><sub>Captura por categoría, calcula fracciones de kilo, gramos o monto</sub></td>
<td width="25%" align="center">🛒<br><b>Insumos</b><br><sub>Compras de carne y materia prima, por categoría</sub></td>
<td width="25%" align="center">🧾<br><b>Gastos</b><br><sub>Gastos operativos del día a día</sub></td>
<td width="25%" align="center">👷<br><b>Sueldos</b><br><sub>Pagos a ayudantes por turno</sub></td>
</tr>
</table>

Todo se guarda automáticamente en una hoja de **Google Sheets** propia — sin bases de datos que mantener, sin backend que pagar.

---

## ✨ Características

- **Captura de ventas flexible** — por fracción de kilo, gramos exactos o monto en pesos, según el tipo de producto
- **Ticket en vivo** con total corriente y opción de quitar productos antes de cobrar
- **3 métodos de pago**: efectivo, tarjeta, transferencia
- **Modo sin conexión**: si no hay internet al cobrar, la venta queda en cola y se sincroniza sola en cuanto regresa la señal
- **Precios editables** desde una pestaña de Google Sheets, sin tocar el código
- **Categorías de Insumos y Gastos** ajustadas al flujo real del negocio (ver tabla abajo)
- **Instalable como app** en Android e iOS (ícono en pantalla de inicio, sin barra del navegador)

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

Un solo archivo, cero dependencias de build:

```
carnitas-app/
└── index.html    ← HTML + CSS + JavaScript, todo en un archivo
```

- **Sin frameworks, sin npm, sin build step** — se edita y se sube directo
- **Google Identity Services** (OAuth 2.0) para conectar con tu cuenta de Google
- **Google Sheets API v4** para leer precios y escribir ventas/insumos/gastos/sueldos
- Las pestañas `Insumos`, `Gastos` y `Sueldos` se crean solas en tu hoja la primera vez que capturas algo en cada una

---

## 🚀 Despliegue

La app vive en GitHub Pages:

```
https://migueloted3v.github.io/carnitas-app/
```

Para actualizarla: edita `index.html` directo en GitHub (ícono de lápiz → pegar cambios → Commit changes). No hay paso de build — lo que subes es lo que se sirve.

### Primera configuración
1. Abre la app → ⚙ Ajustes
2. Pega tu **Google Client ID** (de Google Cloud Console)
3. Da clic en **Crear hoja nueva en mi Drive** — esto crea el spreadsheet con las pestañas `Ventas` y `Precios`
4. Ajusta los precios en la pestaña `Precios` de tu hoja cuando lo necesites

---

## 🔒 Datos

Todo vive en **tu** Google Drive — la app no tiene servidor propio ni guarda tus datos en ningún otro lugar. El único almacenamiento local (`localStorage` del navegador) es para configuración y ventas pendientes de sincronizar cuando no hay internet.

---

<div align="center">
<sub>Construido para un negocio de carnitas que abre sábado y domingo 🌮</sub>
</div>
