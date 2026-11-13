# Íconos · Carnitas Estilo Clay

Set de 12 íconos propios (7 de módulos + 5 de apoyo), derivados del logo (trazo grueso, naranja, crema y marino), con dos presentaciones:

| Presentación | Dónde se usa | Clase CSS |
|---|---|---|
| **Insignia** (escudo naranja + glifo) | Tarjetas del menú principal | `.icon-badge` |
| **Trazo** (glifo solo) | Encabezados, botones, barra inferior, listas | `.icon` |

Los dos usan **el mismo glifo**: solo cambian los colores, que se controlan con variables CSS.

---

## 1. Archivos

```
/icons
  ├── icons.svg   ← sprite con los 6 íconos + el escudo (<symbol>)
  └── icons.css   ← variables, tamaños, presentación Insignia y tarjeta del menú
```

Cópialos a la raíz del repo (o ajusta las rutas si usas otra carpeta).

En el `<head>` de `index.html`:

```html
<link rel="stylesheet" href="icons/icons.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600&display=swap" rel="stylesheet">
```

> Kanit es opcional; si ya usas otra fuente, quita la línea y el `font` de `.menu-card` toma `system-ui`.

---

## 2. Catálogo

| Módulo | ID del símbolo | Glifo | Reemplaza |
|---|---|---|---|
| Ventas | `icon-ventas` | Cazo de cobre con vapor | 🥩 |
| Cotizaciones | `icon-cotizaciones` | Portapapeles con palomita | 📝 |
| Insumos | `icon-insumos` | Carrito de supermercado | 🛒 |
| Gastos | `icon-gastos` | Cartera con flecha de salida | 🧾 |
| Sueldos | `icon-sueldos` | Trabajador con moneda | 👷 |
| Ventas · día y semana | `icon-ventas-semana` | Calendario con barras | 📊 |
| Asuetos y pronóstico | `icon-asuetos` | Calendario con estrella (festivo) | — |
| Venta perdida | `icon-venta-perdida` | Gráfica a la baja | 📉 |
| Transferencia | `icon-transferencia` | Banco | 🏦 |
| Efectivo | `icon-efectivo` | Billetes | 💵 |
| Tarjeta | `icon-tarjeta` | Tarjeta bancaria | 💳 |
| Ajustes | `icon-ajustes` | Controles deslizables | ⚙ |
| *(contenedor)* | `icon-badge` | Escudo del logo (80×88) | — |

**Especificación del glifo:** grid 48×48, trazo 3 px (3.6 px a 24 px), puntas y uniones redondeadas.

### Paleta

| Token | Hex | Uso |
|---|---|---|
| `--clay-orange` | `#F26A1B` | Relleno del glifo (Trazo) y del escudo (Insignia) |
| `--clay-cream` | `#FFF1E2` | Trazo del glifo (Trazo) y relleno (Insignia) |
| `--clay-navy` | `#1D263A` | Fondo de la app y trazo del glifo (Insignia) |
| `--clay-card` | `#262F48` | Fondo de tarjetas |
| `--clay-border` | `#34405E` | Bordes y divisores |

---

## 3. Cómo usarlos

### 3.1 Menú principal: presentación Insignia

Reemplaza cada tarjeta actual (la que tiene el emoji) por:

```html
<nav class="menu-grid" aria-label="Menú principal">

  <a class="menu-card" href="#ventas">
    <svg class="icon-badge" viewBox="0 0 80 88" aria-hidden="true">
      <use href="icons/icons.svg#icon-badge"/>
      <use href="icons/icons.svg#icon-ventas" x="16" y="18" width="48" height="48"/>
    </svg>
    Ventas
  </a>

  <a class="menu-card" href="#cotizaciones">
    <svg class="icon-badge" viewBox="0 0 80 88" aria-hidden="true">
      <use href="icons/icons.svg#icon-badge"/>
      <use href="icons/icons.svg#icon-cotizaciones" x="16" y="18" width="48" height="48"/>
    </svg>
    Cotizaciones
  </a>

  <!-- … mismo patrón para insumos, gastos, sueldos y ventas-semana … -->

</nav>
```

Si tu menú se genera con JavaScript, usa un arreglo con la configuración y renderiza el mismo HTML para cada módulo:

```js
const MODULOS = [
  { id: 'ventas',        label: 'Ventas',                icon: 'icon-ventas' },
  { id: 'cotizaciones',  label: 'Cotizaciones',          icon: 'icon-cotizaciones' },
  { id: 'insumos',       label: 'Insumos',               icon: 'icon-insumos' },
  { id: 'gastos',        label: 'Gastos',                icon: 'icon-gastos' },
  { id: 'sueldos',       label: 'Sueldos',               icon: 'icon-sueldos' },
  { id: 'ventas-semana', label: 'Ventas · día y semana', icon: 'icon-ventas-semana' },
];

const SPRITE = 'icons/icons.svg';

function badge(icon) {
  return `
    <svg class="icon-badge" viewBox="0 0 80 88" aria-hidden="true">
      <use href="${SPRITE}#icon-badge"/>
      <use href="${SPRITE}#${icon}" x="16" y="18" width="48" height="48"/>
    </svg>`;
}

document.querySelector('.menu-grid').innerHTML = MODULOS.map(m => `
  <a class="menu-card" href="#${m.id}">
    ${badge(m.icon)}
    ${m.label}
  </a>`).join('');
```

### 3.2 Resto de la app: presentación Trazo

```html
<!-- Encabezado de una pantalla -->
<h1 class="screen-title">
  <svg class="icon icon--md" aria-hidden="true"><use href="icons/icons.svg#icon-insumos"/></svg>
  Insumos
</h1>

<!-- Botón -->
<button type="button" class="btn">
  <svg class="icon icon--sm" aria-hidden="true"><use href="icons/icons.svg#icon-cotizaciones"/></svg>
  Nueva cotización
</button>

<!-- Botón solo con ícono: lleva aria-label -->
<button type="button" class="btn-icon" aria-label="Registrar gasto">
  <svg class="icon icon--md" aria-hidden="true"><use href="icons/icons.svg#icon-gastos"/></svg>
</button>

<!-- Pestaña inactiva de la barra inferior -->
<svg class="icon icon--sm icon--muted" aria-hidden="true"><use href="icons/icons.svg#icon-sueldos"/></svg>
```

### 3.3 Tamaños disponibles

| Clase | Tamaño | Uso típico |
|---|---|---|
| `.icon--sm` | 24 px (trazo 3.6) | Barra inferior, botones, listas |
| `.icon--md` | 32 px | Encabezados de pantalla |
| `.icon--lg` | 52 px | Estados vacíos, tarjetas grandes |
| `.icon-badge` | 66×72 px | Menú principal (cel) |
| `.icon-badge--lg` | 88×96 px | Menú principal (tablet / escritorio) |

### 3.4 Cambiar colores

Sin tocar el SVG, solo sobreescribe las variables:

```css
.alerta .icon { --icon-fill: #E5484D; }          /* p. ej. gasto fuera de presupuesto */
.menu-card[aria-current="page"] .icon-badge { --badge-stroke: var(--clay-orange); }
```

---

## 4. Funcionamiento offline (PWA)

El sprite es un archivo aparte, así que **hay que agregarlo al caché del service worker**; si no, los íconos no se ven sin conexión.

En `sw.js`, dentro de la lista de archivos que precacheas:

```js
const ASSETS = [
  './',
  './index.html',
  './icons/icons.svg',   // ← nuevo
  './icons/icons.css',   // ← nuevo
  // … el resto
];
```

Y **sube la versión del caché** (p. ej. `carnitas-v12` → `carnitas-v13`) para que los celulares que ya tienen la app instalada descarguen los archivos nuevos.

---

## 5. Notas técnicas

- **Por qué sprite y no PNG:** pesa ~4 KB en total, se ve nítido en cualquier pantalla y los colores se cambian con CSS.
- **Mismo origen:** `<use href="icons/icons.svg#…">` funciona en GitHub Pages porque el sprite está en el mismo dominio. No lo sirvas desde otro dominio o CDN: los navegadores bloquean `<use>` externo entre dominios.
- **Alternativa inline:** si prefieres cero peticiones extra, pega el contenido de `icons.svg` justo después de `<body>`, agrega `style="display:none"` a esa etiqueta `<svg>` raíz y usa `href="#icon-ventas"` (sin la ruta). Las variables CSS funcionan igual. **No** pongas `display:none` en el archivo externo: ahí oculta los íconos.
- **Comentarios en el sprite:** dentro de `<!-- -->` no escribas dos guiones seguidos (p. ej. `--icon-fill`). Es XML inválido y el navegador deja de mostrar *todos* los íconos sin marcar error.
- **Accesibilidad:** los SVG llevan `aria-hidden="true"` porque el texto de la tarjeta ya los describe. En botones que solo tienen ícono, pon `aria-label` en el `<button>`.
- **Área táctil:** las tarjetas miden mínimo 148 px de alto y los botones de ícono deben medir al menos 44×44 px.

---

## 6. Agregar un ícono nuevo

1. Dibújalo en un lienzo de **48×48** con trazo de 3 px, puntas redondeadas y máximo 1–2 formas rellenas.
2. Agrégalo a `icons.svg` como `<symbol id="icon-nombre" viewBox="0 0 48 48">`, copiando la estructura de uno existente:
   - Forma principal → `style="fill:var(--icon-fill,#F26A1B)"`
   - Líneas → `style="fill:none"`
   - Detalles sólidos → `style="fill:var(--icon-stroke,#FFF1E2)"`
3. Pruébalo a 24 px y dentro del escudo antes de publicarlo.
4. Sube la versión del caché del service worker.

---

## 7. Checklist de integración

- [ ] Copiar `icons/icons.svg` e `icons/icons.css` al repo
- [ ] Enlazar `icons.css` en el `<head>`
- [ ] Reemplazar los emojis del menú principal por la presentación Insignia
- [ ] Usar la presentación Trazo en encabezados y botones de cada módulo
- [ ] Agregar `icons.svg` e `icons.css` a la lista de precache del service worker
- [ ] Subir la versión del caché
- [ ] Probar en el cel: con conexión, en modo avión y con la app instalada
