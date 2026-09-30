/**
 * Carnitas App — servicio web (Google Apps Script)
 * Versión: 2.2.0
 *
 * Vive pegado a la hoja "Carnitas Ventas" (Extensiones → Apps Script).
 * La app y el tablero le mandan y le piden datos con una clave; así la app
 * ya no necesita iniciar sesión con Google.
 *
 * Primera vez:
 *   1. Pega este archivo completo en el editor de Apps Script.
 *   2. Ejecuta la función crearClave() y copia la clave del registro.
 *   3. Implementar → Nueva implementación → Aplicación web
 *      (Ejecutar como: Yo · Quién tiene acceso: Cualquier persona).
 *   4. Pega la URL /exec y la clave en ⚙ Ajustes de la app.
 */

const SCRIPT_VERSION = '2.2.0';
const TZ = 'America/Mexico_City';

// Pestañas que se pueden escribir y leer desde la app, con su encabezado oficial.
// Si una pestaña ya existe con menos columnas, se agregan las que falten al final
// (nunca se mueven ni se borran columnas existentes).
const HOJAS = {
  Ventas:         ['Fecha','Ticket','Categoría','Producto','Modo','Cantidad','Precio unitario','Total','Método de pago'],
  Insumos:        ['Fecha','Categoría','Producto','Cantidad','Tipo','Precio unitario','Costo total','Proveedor'],
  Gastos:         ['Fecha','Categoría','Descripción','Monto','Proveedor'],
  Sueldos:        ['Fecha','Nombre','Puesto','Días trabajados','Monto pagado'],
  VentasPerdidas: ['Fecha','Categoría','Kilos estimados','Motivo','Monto estimado','Piezas estimadas'],
  Precios:        ['Producto','Precio','Precio medio','Precio cuarto'],
  Cuenta:         ['Campo','Valor']
};

// Renglones que se crean en la pestaña Cuenta (el valor lo llenas tú en la hoja)
const CAMPOS_CUENTA = ['CLABE','Beneficiario','Institución','Celular (Dimo)'];

/* ---------- Configuración inicial ---------- */

/** Ejecútala una sola vez desde el editor. Genera la clave y la muestra en el registro. */
function crearClave() {
  const props = PropertiesService.getScriptProperties();
  let clave = props.getProperty('APP_KEY');
  if (!clave) {
    clave = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
    props.setProperty('APP_KEY', clave);
  }
  Logger.log('Tu clave de acceso es: ' + clave);
  return clave;
}

/** Úsala solo si crees que alguien más conoce tu clave. Después actualízala en la app. */
function cambiarClave() {
  PropertiesService.getScriptProperties().deleteProperty('APP_KEY');
  return crearClave();
}

/* ---------- Entrada web ---------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    validarClave(p.key);
    switch (p.action) {
      case 'ping':     return responder({ ok: true, version: SCRIPT_VERSION, hoja: SpreadsheetApp.getActive().getName() });
      case 'precios':  return responder({ ok: true, filas: leer('Precios') });
      case 'insumos':  return responder({ ok: true, filas: leer('Insumos') });
      case 'cuenta':   return responder({ ok: true, filas: leer('Cuenta') });
      case 'rango':    return responder({ ok: true, datos: porRango(p.desde, p.hasta) });
      case 'ventas':   return responder({ ok: true, filas: ventasPorFechas(p.fechas) });
      case 'todo':     return responder({ ok: true, version: SCRIPT_VERSION, datos: leerTodo() });
      default:         return responder({ ok: false, error: 'Acción no reconocida' });
    }
  } catch (err) {
    return responder({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    validarClave(body.key);
    if (body.action === 'append')       return responder(agregarFilas(body));
    if (body.action === 'initPrecios')  return responder(inicializarPrecios(body.precios));
    if (body.action === 'initCuenta')   return responder(inicializarCuenta());
    return responder({ ok: false, error: 'Acción no reconocida' });
  } catch (err) {
    return responder({ ok: false, error: String(err.message || err) });
  }
}

/* ---------- Escritura ---------- */

/**
 * Agrega filas a una pestaña. Cada envío trae un id único: si la app reintenta
 * un envío que sí llegó (se cortó la señal antes de recibir la respuesta),
 * no se duplica.
 */
function agregarFilas(body) {
  const hoja = body.sheet;
  const filas = body.rows;
  if (!HOJAS[hoja]) throw new Error('Pestaña no permitida: ' + hoja);
  if (!Array.isArray(filas) || filas.length === 0) return { ok: true, agregadas: 0 };

  const cache = CacheService.getScriptCache();
  const idKey = body.id ? 'env_' + body.id : null;
  if (idKey && cache.get(idKey)) return { ok: true, agregadas: 0, duplicado: true };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (idKey && cache.get(idKey)) return { ok: true, agregadas: 0, duplicado: true };
    const sh = asegurarHoja(hoja);
    const ancho = Math.max(HOJAS[hoja].length, ...filas.map(f => f.length));
    const normalizadas = filas.map(f => {
      const r = f.slice(0, ancho);
      while (r.length < ancho) r.push('');
      return r;
    });
    const inicio = sh.getLastRow() + 1;
    sh.getRange(inicio, 1, normalizadas.length, ancho).setValues(normalizadas);
    // Las fechas llegan como texto "aaaa-mm-dd hh:mm:ss"; se convierten a fecha real
    const col = sh.getRange(inicio, 1, normalizadas.length, 1);
    col.setValues(col.getValues().map(([v]) => [aFecha(v)]));
    if (idKey) cache.put(idKey, '1', 21600); // 6 horas
    return { ok: true, agregadas: normalizadas.length };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Prepara la pestaña Precios para precios por kilo, medio y cuarto.
 * precios = { Producto: [kilo, medio, cuarto], ... }
 * - Agrega las columnas "Precio medio" y "Precio cuarto" si faltan.
 * - Llena medio y cuarto solo donde estén vacíos (no pisa lo que ya capturaste).
 * - El precio por kilo solo se cambia si todavía tiene el valor provisional de 380.
 * - Agrega los productos que falten (por ejemplo, Surtido).
 */
function inicializarPrecios(precios) {
  precios = precios || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = asegurarHoja('Precios');
    const n = Math.max(sh.getLastRow() - 1, 0);
    const filas = n ? sh.getRange(2, 1, n, 4).getValues() : [];
    const vistos = {};
    let cambios = 0;
    filas.forEach(r => {
      const nombre = String(r[0]).trim();
      const p = precios[nombre];
      vistos[nombre] = true;
      if (!p) return;
      if (Number(r[1]) === 380 && p[0] !== 380) { r[1] = p[0]; cambios++; }
      if (r[2] === '' && p[1] !== '' && p[1] != null) { r[2] = p[1]; cambios++; }
      if (r[3] === '' && p[2] !== '' && p[2] != null) { r[3] = p[2]; cambios++; }
    });
    if (filas.length) sh.getRange(2, 1, filas.length, 4).setValues(filas);
    const nuevos = Object.keys(precios).filter(k => !vistos[k]).map(k => [k, precios[k][0], precios[k][1] ?? '', precios[k][2] ?? '']);
    if (nuevos.length) sh.getRange(sh.getLastRow() + 1, 1, nuevos.length, 4).setValues(nuevos);
    return { ok: true, cambios: cambios, agregados: nuevos.map(r => r[0]) };
  } finally {
    lock.releaseLock();
  }
}

/** Crea la pestaña Cuenta con sus campos vacíos. Si ya tiene datos, no la toca. */
function inicializarCuenta() {
  const sh = asegurarHoja('Cuenta');
  if (sh.getLastRow() > 1) return { ok: true, creada: false };
  sh.getRange(2, 1, CAMPOS_CUENTA.length, 2).setValues(CAMPOS_CUENTA.map(c => [c, '']));
  sh.getRange(2, 2, CAMPOS_CUENTA.length, 1).setNumberFormat('@'); // CLABE y celular como texto, sin notación científica
  return { ok: true, creada: true };
}

function asegurarHoja(nombre) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(nombre);
  const enc = HOJAS[nombre];
  if (!sh) {
    sh = ss.insertSheet(nombre);
    sh.getRange(1, 1, 1, enc.length).setValues([enc]);
    sh.setFrozenRows(1);
    return sh;
  }
  const ultimaCol = Math.max(sh.getLastColumn(), 1);
  const actual = sh.getRange(1, 1, 1, ultimaCol).getValues()[0];
  if (actual.length < enc.length || actual.some((v, i) => i < enc.length && v === '')) {
    // Completa encabezados faltantes sin mover los existentes
    const nuevo = enc.map((h, i) => (actual[i] !== undefined && actual[i] !== '') ? actual[i] : h);
    sh.getRange(1, 1, 1, nuevo.length).setValues([nuevo]);
  }
  // Migración de VentasPerdidas: "Corte deseado" pasa a "Categoría"
  if (nombre === 'VentasPerdidas' && sh.getRange(1, 2).getValue() === 'Corte deseado') {
    sh.getRange(1, 2).setValue('Categoría');
  }
  return sh;
}

/* ---------- Lectura ---------- */

function leer(nombre) {
  const sh = SpreadsheetApp.getActive().getSheetByName(nombre);
  if (!sh || sh.getLastRow() < 2) return [];
  const valores = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  return valores
    .filter(r => r.some(v => v !== '' && v !== null))
    .map(r => r.map(v => (v instanceof Date) ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm:ss') : v));
}

function ventasPorFechas(fechasTxt) {
  const fechas = String(fechasTxt || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!fechas.length) return [];
  const set = {};
  fechas.forEach(f => set[f] = true);
  return leer('Ventas').filter(r => set[String(r[0]).slice(0, 10)]);
}

/** Ventas, insumos, gastos y sueldos entre dos fechas (aaaa-mm-dd, ambas incluidas). */
function porRango(desde, hasta) {
  const ok = /^\d{4}-\d{2}-\d{2}$/;
  if (!ok.test(String(desde)) || !ok.test(String(hasta))) throw new Error('Fechas inválidas');
  const out = {};
  ['Ventas', 'Insumos', 'Gastos', 'Sueldos'].forEach(n => {
    out[n] = leer(n).filter(r => { const d = String(r[0]).slice(0, 10); return d >= desde && d <= hasta; });
  });
  return out;
}

function leerTodo() {
  const out = {};
  Object.keys(HOJAS).forEach(n => out[n] = leer(n));
  return out;
}

/* ---------- Utilidades ---------- */

function validarClave(k) {
  const clave = PropertiesService.getScriptProperties().getProperty('APP_KEY');
  if (!clave) throw new Error('Falta crear la clave: ejecuta crearClave() en el editor');
  if (!k || k !== clave) throw new Error('Clave incorrecta');
}

function aFecha(v) {
  if (v instanceof Date || typeof v !== 'string') return v;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return v;
  const txt = `${m[1]}-${m[2]}-${m[3]} ${m[4] || '00'}:${m[5] || '00'}:${m[6] || '00'}`;
  return Utilities.parseDate(txt, TZ, 'yyyy-MM-dd HH:mm:ss');
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
