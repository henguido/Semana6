// Cruza el resultado TAP de la suite contra tests/fallos-esperados.json y decide
// el código de salida de verificar.sh. No es parte de la suite ni de la
// especificación: es la infraestructura de la puerta de verificación.
//
// Reglas:
//   - Una prueba que NO está en el manifest y falla       -> regresión real.
//   - Una prueba que SÍ está en el manifest y falla        -> hallazgo abierto
//     confirmado, tal como se esperaba.
//   - Una prueba que SÍ está en el manifest y pasa          -> posible cierre de
//     hallazgo sin actualizar HALLAZGOS.md/el manifest, salvo que la propia
//     entrada del manifest declare una ventana de exención horaria conocida
//     (ver "exentoSiHoraLocalMenorQue" en fallos-esperados.json) y estemos
//     dentro de ella.
//   - Una entrada del manifest que no corresponde a ninguna prueba real (nombre
//     desactualizado) -> inconsistencia de bookkeeping.
//
// Uso: node tests/verificar-resultado.js <archivo-tap> <manifest-json>

const fs = require('node:fs');

const [, , rutaTap, rutaManifest] = process.argv;
if (!rutaTap || !rutaManifest) {
  console.error('Uso: node verificar-resultado.js <archivo-tap> <manifest-json>');
  process.exit(2);
}

const tap = fs.readFileSync(rutaTap, 'utf8');
const manifest = JSON.parse(fs.readFileSync(rutaManifest, 'utf8'));

const resultados = new Map(); // nombre de prueba -> boolean (pasó)
const lineaResultado = /^(ok|not ok) \d+ - (.+?)\s*$/;
for (const linea of tap.split('\n')) {
  const m = linea.match(lineaResultado);
  if (!m) continue;
  const paso = m[1] === 'ok';
  const nombre = m[2];
  resultados.set(nombre, paso);
}

if (resultados.size === 0) {
  console.error('No se pudo interpretar ninguna prueba en la salida TAP. ¿Falló la suite antes de arrancar?');
  console.error('--- salida cruda ---');
  console.error(tap);
  process.exit(1);
}

const horaLocalActual = new Date().getHours();

const manifestPorNombre = new Map(manifest.map((e) => [e.prueba, e]));

let regresionesReales = [];
let hallazgosConfirmados = [];
let posiblesCierres = [];
let exencionesAplicadas = [];
let manifestDesactualizado = [];

for (const [nombre, paso] of resultados) {
  const entrada = manifestPorNombre.get(nombre);
  if (!entrada) {
    if (!paso) regresionesReales.push(nombre);
    continue;
  }
  if (!paso) {
    hallazgosConfirmados.push({ nombre, hallazgo: entrada.hallazgo });
  } else {
    const exento = typeof entrada.exentoSiHoraLocalMenorQue === 'number'
      && horaLocalActual < entrada.exentoSiHoraLocalMenorQue;
    if (exento) {
      exencionesAplicadas.push({ nombre, hallazgo: entrada.hallazgo, nota: entrada.notaExencion });
    } else {
      posiblesCierres.push({ nombre, hallazgo: entrada.hallazgo });
    }
  }
}

for (const entrada of manifest) {
  if (!resultados.has(entrada.prueba)) {
    manifestDesactualizado.push(entrada.prueba);
  }
}

const pasanSinMarcar = [...resultados.entries()].filter(([n, p]) => p && !manifestPorNombre.has(n)).length;

console.log('== Cruce contra tests/fallos-esperados.json ==');
console.log(`Total de pruebas evaluadas:              ${resultados.size}`);
console.log(`Pasan (sin hallazgo asociado):            ${pasanSinMarcar}`);
console.log(`Fallan como hallazgo abierto confirmado:  ${hallazgosConfirmados.length}`);
for (const h of hallazgosConfirmados) console.log(`  - [${h.hallazgo}] ${h.nombre}`);
console.log(`Exentas por ventana horaria documentada:  ${exencionesAplicadas.length}`);
for (const e of exencionesAplicadas) {
  console.log(`  - [${e.hallazgo}] ${e.nombre}`);
  console.log(`    (hora local actual: ${horaLocalActual}h) ${e.nota}`);
}
console.log(`Regresiones reales (no manifestadas):     ${regresionesReales.length}`);
for (const r of regresionesReales) console.log(`  - ${r}`);
console.log(`Posibles hallazgos cerrados sin actualizar HALLAZGOS.md/manifest: ${posiblesCierres.length}`);
for (const p of posiblesCierres) console.log(`  - [${p.hallazgo}] ${p.nombre}`);
console.log(`Entradas del manifest sin prueba correspondiente: ${manifestDesactualizado.length}`);
for (const m of manifestDesactualizado) console.log(`  - ${m}`);

const huboProblema = regresionesReales.length > 0
  || posiblesCierres.length > 0
  || manifestDesactualizado.length > 0;

if (huboProblema) {
  console.log();
  if (regresionesReales.length > 0) {
    console.log('RESULTADO: falla por regresión real (prueba no manifestada que falla).');
  }
  if (posiblesCierres.length > 0) {
    console.log('RESULTADO: falla porque un hallazgo parece corregido pero HALLAZGOS.md y');
    console.log('tests/fallos-esperados.json siguen sin actualizarse. Si de verdad se corrigió,');
    console.log('actualiza HALLAZGOS.md (estado: cerrado, con evidencia) y quita la entrada del');
    console.log('manifest — la prueba en sí no se toca.');
  }
  if (manifestDesactualizado.length > 0) {
    console.log('RESULTADO: falla porque el manifest referencia una prueba que ya no existe con ese nombre.');
  }
  process.exit(1);
}

console.log();
console.log('OK: todos los fallos son exactamente los hallazgos abiertos conocidos.');
process.exit(0);
