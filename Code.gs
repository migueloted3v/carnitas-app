/**
 * Carnitas App — servicio web (Google Apps Script)
 * Versión: 2.4.0
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
 *
 * Mantenimiento (se ejecutan a mano desde el editor, una sola vez):
 *   - ajustarZonaHoraria()  pone la hoja en hora de Ciudad de México.
 *   - revisarSurtido()      simulación: dice cuántos renglones de Surtido se juntarían, sin tocar nada.
 *   - consolidarSurtido()   hace un respaldo de la hoja y junta cada Surtido repartido en un solo renglón.
 */

const SCRIPT_VERSION = '2.4.0';
const TZ = 'America/Mexico_City'; // respaldo si la hoja no tiene zona horaria

// Las fechas se leen y escriben SIEMPRE con la zona horaria de la propia hoja
// (Archivo → Configuración). Así la hora que ves en la celda es la misma que
// recibe la app, sin importar si la fecha la capturó la app o tú a mano.
let _tzHoja = null;
function tzHoja() {
  if (!_tzHoja) _tzHoja = SpreadsheetApp.getActive().getSpreadsheetTimeZone() || TZ;
  return _tzHoja;
}

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
  Cuenta:         ['Campo','Valor'],
  Cotizaciones:   ['Folio','ID','Creada','Actualizada','Estado','Cliente','WhatsApp','Ocasión','Fecha evento','Horario',
                   'Ubicación','Zona','Personas','Precio por persona','Extras','Cazo','Facturar','Subtotal','IVA','Total',
                   'Anticipo','Saldo','Costo estimado','Margen estimado','Válida hasta','Anticipo pagado','Método anticipo',
                   'Fecha anticipo','Saldo pagado','Método saldo','Fecha saldo','Motivo rechazo','Ticket venta','Notas']
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
      case 'ping':     return responder({ ok: true, version: SCRIPT_VERSION, tz: tzHoja(), hoja: SpreadsheetApp.getActive().getName() });
      case 'precios':  return responder({ ok: true, filas: leer('Precios') });
      case 'insumos':  return responder({ ok: true, filas: leer('Insumos') });
      case 'cuenta':   return responder({ ok: true, filas: leer('Cuenta') });
      case 'cotizaciones': return responder({ ok: true, columnas: HOJAS.Cotizaciones, filas: leer('Cotizaciones') });
      case 'rango':    return responder({ ok: true, datos: porRango(p.desde, p.hasta) });
      case 'ventas':   return responder({ ok: true, filas: ventasPorFechas(p.fechas) });
      case 'todo':     return responder({ ok: true, version: SCRIPT_VERSION, tz: tzHoja(), datos: leerTodo() });
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
    if (body.action === 'guardarCotizacion') return responder(guardarCotizacion(body.cot));
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
    return escribirFilas_(hoja, filas, idKey);
  } finally {
    lock.releaseLock();
  }
}

/** Escribe las filas al final de la pestaña. Quien la llama ya tiene el candado. */
function escribirFilas_(hoja, filas, idKey) {
  const cache = CacheService.getScriptCache();
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

/* ---------- Cotizaciones ---------- */

// Columnas de Cotizaciones que son fecha (se guardan como fecha real en la hoja)
const COT_FECHAS = ['Creada','Actualizada','Fecha evento','Válida hasta','Fecha anticipo','Fecha saldo'];

/**
 * Crea o actualiza una cotización (un renglón por cotización, se busca por ID).
 * - La primera vez que llega se le asigna el folio COT-AA-#### (consecutivo por año).
 * - Reenviar la misma cotización no la duplica: se sobreescribe su renglón.
 * - Si trae convertir: true y aún no tiene venta, agrega un renglón en Ventas con el
 *   folio como ticket, en la fecha del evento, por el subtotal sin IVA.
 * cot = { 'ID': ..., 'Cliente': ..., ... } con las llaves de HOJAS.Cotizaciones
 */
function guardarCotizacion(cot) {
  if (!cot || !cot['ID']) throw new Error('Cotización sin ID');
  const enc = HOJAS.Cotizaciones;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = asegurarHoja('Cotizaciones');
    const col = nombre => enc.indexOf(nombre);
    const n = Math.max(sh.getLastRow() - 1, 0);
    const actuales = n ? sh.getRange(2, 1, n, enc.length).getValues() : [];
    let fila = actuales.findIndex(r => String(r[col('ID')]) === String(cot['ID']));
    const previa = fila >= 0 ? actuales[fila] : null;

    let folio = previa ? String(previa[col('Folio')]) : '';
    if (!folio) {
      const aa = Utilities.formatDate(new Date(), tzHoja(), 'yy');
      const prefijo = 'COT-' + aa + '-';
      const max = actuales.reduce((m, r) => {
        const f = String(r[col('Folio')]);
        return f.indexOf(prefijo) === 0 ? Math.max(m, Number(f.slice(prefijo.length)) || 0) : m;
      }, 0);
      folio = prefijo + String(max + 1).padStart(4, '0');
    }

    const datos = Object.assign({}, cot, { 'Folio': folio, 'Actualizada': ahoraTexto_() });
    if (previa && previa[col('Ticket venta')]) datos['Ticket venta'] = previa[col('Ticket venta')]; // una venta por cotización

    let venta = false;
    if (cot.convertir && !datos['Ticket venta']) {
      const fecha = String(datos['Fecha evento'] || '').slice(0, 10) || ahoraTexto_().slice(0, 10);
      const hora = (String(datos['Horario'] || '').match(/(\d{1,2}):(\d{2})/) || [null, '12', '00']);
      const personas = Number(datos['Personas']) || 0;
      escribirFilas_('Ventas', [[`${fecha} ${hora[1].padStart(2, '0')}:${hora[2]}:00`, folio, 'Evento', 'Paquete por persona', 'Persona',
                personas, Number(datos['Precio por persona']) || 0, Number(datos['Subtotal']) || 0,
                datos['Método saldo'] || datos['Método anticipo'] || 'Transferencia']], 'env_cot_' + cot['ID']);
      datos['Ticket venta'] = folio;
      datos['Estado'] = 'Convertida';
      venta = true;
    }

    const renglon = enc.map(h => {
      const v = datos[h] == null ? '' : datos[h];
      return COT_FECHAS.indexOf(h) >= 0 ? aFecha(String(v)) : v;
    });
    const destino = fila >= 0 ? fila + 2 : sh.getLastRow() + 1;
    sh.getRange(destino, col('WhatsApp') + 1).setNumberFormat('@');
    sh.getRange(destino, 1, 1, enc.length).setValues([renglon]);
    return { ok: true, folio: folio, estado: datos['Estado'], ticket: datos['Ticket venta'] || '', venta: venta };
  } finally {
    lock.releaseLock();
  }
}

function ahoraTexto_() { return Utilities.formatDate(new Date(), tzHoja(), 'yyyy-MM-dd HH:mm:ss'); }

/* ---------- Lectura ---------- */

function leer(nombre) {
  const sh = SpreadsheetApp.getActive().getSheetByName(nombre);
  if (!sh || sh.getLastRow() < 2) return [];
  const n = sh.getLastRow() - 1;
  const valores = sh.getRange(2, 1, n, sh.getLastColumn()).getValues();
  // La fecha se toma tal como se VE en la celda: así nunca se recorre por zonas horarias
  const textos = sh.getRange(2, 1, n, 1).getDisplayValues();
  return valores
    .map((r, i) => r.map((v, j) => j === 0 ? fechaCelda(v, textos[i][0])
                         : (v instanceof Date ? Utilities.formatDate(v, tzHoja(), 'yyyy-MM-dd HH:mm:ss') : v)))
    .filter(r => r.some(v => v !== '' && v !== null));
}

let _mdy = null;
function fechaEnOrdenMDY() {
  if (_mdy === null) _mdy = /^en[_-]US/i.test(SpreadsheetApp.getActive().getSpreadsheetLocale() || '');
  return _mdy;
}

/** Texto visible de la celda Fecha (4/10/2026 14:42:12, 2/10/2026, 2026-10-02…) → aaaa-mm-dd hh:mm:ss */
function fechaCelda(v, txt) {
  const t = String(txt || '').trim();
  const p2 = x => String(x).padStart(2, '0');
  const hora = (h, mi, se, ampm) => {
    let hh = Number(h || 0);
    if (ampm && /p/i.test(ampm) && hh < 12) hh += 12;
    if (ampm && /a/i.test(ampm) && hh === 12) hh = 0;
    return `${p2(hh)}:${p2(mi || 0)}:${p2(se || 0)}`;
  };
  let m = t.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?\s?m\.?)?)?/i);
  if (m) {
    const mdy = fechaEnOrdenMDY();
    return `${m[3]}-${p2(mdy ? m[1] : m[2])}-${p2(mdy ? m[2] : m[1])} ${hora(m[4], m[5], m[6], m[7])}`;
  }
  m = t.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?\s?m\.?)?)?/i);
  if (m) return `${m[1]}-${p2(m[2])}-${p2(m[3])} ${hora(m[4], m[5], m[6], m[7])}`;
  if (v instanceof Date) return Utilities.formatDate(v, tzHoja(), 'yyyy-MM-dd HH:mm:ss');
  return fechaTexto(v);
}

/** Diagnóstico: compara lo que se ve en la celda con lo que entrega el servicio (no modifica nada). */
function diagnosticarFechas() {
  const ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName('Ventas');
  const fila = sh.getLastRow();
  const v = sh.getRange(fila, 1).getValue(), txt = sh.getRange(fila, 1).getDisplayValue();
  Logger.log('Zona de la hoja: ' + ss.getSpreadsheetTimeZone() + ' · zona del script: ' + Session.getScriptTimeZone() + ' · configuración regional: ' + ss.getSpreadsheetLocale());
  Logger.log('Celda A' + fila + ' se ve como: ' + txt);
  Logger.log('Valor interno (UTC): ' + (v instanceof Date ? v.toISOString() : v));
  Logger.log('Con la zona de la hoja: ' + (v instanceof Date ? Utilities.formatDate(v, tzHoja(), 'yyyy-MM-dd HH:mm:ss') : v));
  Logger.log('Lo que entrega el servicio 2.3.1: ' + fechaCelda(v, txt));
}

/** Fecha capturada como texto (25/09/2026, 25-9-2026 o 2026-09-25) → aaaa-mm-dd. */
function fechaTexto(v) {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  let m = t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(.*)$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}${m[4]}`;
  m = t.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(.*)$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}${m[4]}`;
  return t;
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

/* ---------- Mantenimiento (ejecutar a mano desde el editor) ---------- */

/**
 * Pone la hoja en hora de Ciudad de México. Las celdas no cambian: Sheets guarda
 * la fecha y hora tal como se ve, y el servicio la lee siempre con la zona de la hoja.
 */
function ajustarZonaHoraria() {
  const ss = SpreadsheetApp.getActive();
  const antes = ss.getSpreadsheetTimeZone();
  if (antes !== TZ) ss.setSpreadsheetTimeZone(TZ);
  Logger.log('Zona horaria de la hoja: ' + antes + (antes !== TZ ? ' → ' + TZ : ' (ya estaba bien)'));
  return TZ;
}

// Cortes en los que la versión anterior de la app repartía cada venta de Surtido
const CORTES_SURTIDO = ['Pierna', 'Buche', 'Nuca', 'Aldilla', 'Costilla'];

/**
 * Agrupa los renglones repartidos de Surtido. Un grupo son los renglones seguidos
 * de un mismo ticket con Modo "Surtido" y producto de la lista de cortes; si un
 * corte se repite dentro del ticket, empieza otra venta de Surtido.
 * Columnas: Fecha, Ticket, Categoría, Producto, Modo, Cantidad, Precio unitario, Total, Método de pago
 */
function planSurtido_(valores) {
  const salida = [];
  let grupos = 0, renglonesGrupo = 0, actual = null;
  const cerrar = () => {
    if (!actual) return;
    const f = actual.filas, base = f[0].slice();
    base[3] = 'Surtido';
    base[4] = 'Surtido';
    base[5] = Math.round(f.reduce((s, r) => s + (Number(r[5]) || 0), 0) * 1000) / 1000;
    base[7] = f.reduce((s, r) => s + (Number(r[7]) || 0), 0);
    salida.push(base);
    grupos++; renglonesGrupo += f.length;
    actual = null;
  };
  valores.forEach(r => {
    const esCorte = r[4] === 'Surtido' && r[2] === 'Carne' && CORTES_SURTIDO.indexOf(String(r[3])) >= 0;
    if (!esCorte) { cerrar(); salida.push(r); return; }
    const ticket = String(r[1]);
    if (actual && (actual.ticket !== ticket || actual.cortes[r[3]])) cerrar();
    if (!actual) actual = { ticket: ticket, cortes: {}, filas: [] };
    actual.cortes[r[3]] = true;
    actual.filas.push(r);
  });
  cerrar();
  return { salida: salida, grupos: grupos, renglonesGrupo: renglonesGrupo };
}

function sumaTotal_(filas) { return filas.reduce((s, r) => s + (Number(r[7]) || 0), 0); }

/** Simulación: no modifica nada. Revisa el registro (Ver → Registros) para ver el resultado. */
function revisarSurtido() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Ventas');
  const n = sh.getLastRow() - 1;
  if (n < 1) { Logger.log('La pestaña Ventas está vacía'); return; }
  const valores = sh.getRange(2, 1, n, 9).getValues();
  const plan = planSurtido_(valores);
  Logger.log('Renglones de Ventas hoy: ' + valores.length);
  Logger.log('Ventas de Surtido repartidas: ' + plan.grupos + ' (en ' + plan.renglonesGrupo + ' renglones)');
  Logger.log('Renglones después de consolidar: ' + plan.salida.length);
  Logger.log('Total vendido antes: ' + sumaTotal_(valores) + ' · después: ' + sumaTotal_(plan.salida));
  return plan.grupos;
}

/**
 * Junta cada venta de Surtido repartida en un renglón: Producto "Surtido", Modo "Surtido",
 * Cantidad = kilos sumados, Total = total sumado. Fecha, ticket, precio y método no cambian.
 * Antes hace una copia de respaldo de toda la hoja en tu Drive. Si los totales no
 * cuadran, no escribe nada. Se puede ejecutar dos veces sin problema: lo ya consolidado no se toca.
 */
function consolidarSurtido() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Ventas');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const n = sh.getLastRow() - 1;
    if (n < 1) { Logger.log('La pestaña Ventas está vacía'); return; }
    const ancho = Math.max(sh.getLastColumn(), 9);
    const valores = sh.getRange(2, 1, n, ancho).getValues();
    const plan = planSurtido_(valores);
    if (!plan.grupos) { Logger.log('No hay Surtido repartido: nada que consolidar.'); return 0; }
    const antes = sumaTotal_(valores), despues = sumaTotal_(plan.salida);
    if (Math.abs(antes - despues) > 0.001) throw new Error('Los totales no cuadran (' + antes + ' vs ' + despues + '). No se modificó nada.');

    const nombre = ss.getName() + ' RESPALDO antes de consolidar ' + Utilities.formatDate(new Date(), tzHoja(), 'yyyy-MM-dd HH.mm');
    ss.copy(nombre);
    Logger.log('Respaldo creado en tu Drive: ' + nombre);

    sh.getRange(2, 1, n, ancho).clearContent();
    sh.getRange(2, 1, plan.salida.length, ancho).setValues(plan.salida);
    SpreadsheetApp.flush();
    Logger.log('Listo: ' + plan.grupos + ' ventas de Surtido juntadas. Renglones: ' + n + ' → ' + plan.salida.length + '. Total vendido sin cambio: ' + despues);
    return plan.grupos;
  } finally {
    lock.releaseLock();
  }
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
  return Utilities.parseDate(txt, tzHoja(), 'yyyy-MM-dd HH:mm:ss');
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
