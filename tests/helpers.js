// Infraestructura de pruebas de integración (no es código de producción).
//
// server.js arranca su propio servidor HTTP apenas se importa (app.listen en la
// última línea) y usa una ruta fija a reservas.db junto al propio server.js. Como
// en este bloque no se toca server.js, las pruebas lo levantan como proceso hijo
// real y hablan con él por HTTP, cuidando de no pisar la base de datos de
// desarrollo del proyecto.

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const RUTA_DB = path.join(RAIZ, 'reservas.db');
const RUTA_DB_BACKUP = path.join(RAIZ, 'reservas.db.backup-pruebas');
const BASE_URL = 'http://127.0.0.1:3000';

let procesoServidor = null;

async function esperarServidorListo(intentos = 50) {
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.ok) return;
    } catch {
      // todavía no levanta; reintentar
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('El servidor no respondió a tiempo en ' + BASE_URL);
}

async function arrancarServidor() {
  if (fs.existsSync(RUTA_DB)) {
    fs.renameSync(RUTA_DB, RUTA_DB_BACKUP);
  }

  procesoServidor = spawn(process.execPath, ['server.js'], {
    cwd: RAIZ,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let salidaServidor = '';
  procesoServidor.stdout.on('data', (d) => { salidaServidor += d.toString(); });
  procesoServidor.stderr.on('data', (d) => { salidaServidor += d.toString(); });

  procesoServidor.on('exit', (code) => {
    if (code !== null && code !== 0 && !detenerLlamado) {
      console.error('El servidor de pruebas terminó inesperadamente:\n' + salidaServidor);
    }
  });

  await esperarServidorListo();
}

let detenerLlamado = false;

async function detenerServidor() {
  detenerLlamado = true;
  if (procesoServidor) {
    procesoServidor.kill();
    await new Promise((r) => procesoServidor.once('exit', r));
    procesoServidor = null;
  }

  if (fs.existsSync(RUTA_DB)) {
    fs.unlinkSync(RUTA_DB);
  }
  if (fs.existsSync(RUTA_DB_BACKUP)) {
    fs.renameSync(RUTA_DB_BACKUP, RUTA_DB);
  }
}

function hoyISO(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

async function postReserva(campos) {
  const body = new URLSearchParams(campos);
  const res = await fetch(`${BASE_URL}/reservas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return { status: res.status, texto: await res.text() };
}

async function postCancelar(id) {
  const res = await fetch(`${BASE_URL}/reservas/${id}/cancelar`, { method: 'POST' });
  return { status: res.status, texto: await res.text() };
}

async function getDia(fecha) {
  const res = await fetch(`${BASE_URL}/dia/${fecha}`);
  return { status: res.status, texto: await res.text() };
}

async function getInicio(fecha) {
  const res = await fetch(`${BASE_URL}/?fecha=${fecha}`);
  return { status: res.status, texto: await res.text() };
}

async function getCotizar(hora) {
  const res = await fetch(`${BASE_URL}/api/cotizar?hora=${hora}`);
  return res.json();
}

function idDeConfirmacion(html) {
  const m = html.match(/Reserva #(\d+) creada/);
  return m ? Number(m[1]) : null;
}

function precioDeConfirmacion(html) {
  const m = html.match(/Precio: ₡([\d.]+)/);
  return m ? Number(m[1].replace(/\./g, '')) : null;
}

module.exports = {
  BASE_URL,
  arrancarServidor,
  detenerServidor,
  hoyISO,
  postReserva,
  postCancelar,
  getDia,
  getInicio,
  getCotizar,
  idDeConfirmacion,
  precioDeConfirmacion,
};
