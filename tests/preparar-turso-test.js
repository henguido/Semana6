// Deja la base remota de PRUEBA (cancha-total-test) vacía antes de correr la
// suite, equivalente a lo que tests/helpers.js hace localmente moviendo
// reservas.db a un lado antes de arrancar el servidor. No es parte de la
// aplicación ni de verificar.sh: se invoca a mano, solo para demostrar la
// suite contra Turso.
//
// Guardia dura: exige que TURSO_DATABASE_URL identifique inequívocamente a
// cancha-total-test y aborta (sin ejecutar SQL) ante cualquier otro caso,
// incluida la ausencia de las variables o la presencia de cancha-total-prod.

const { crearDb } = require('../db');

const url = process.env.TURSO_DATABASE_URL || '';

if (!url || !process.env.TURSO_AUTH_TOKEN) {
  console.error('Faltan TURSO_DATABASE_URL / TURSO_AUTH_TOKEN. Abortando sin tocar nada.');
  process.exit(1);
}

if (url.includes('cancha-total-prod')) {
  console.error('ABORTADO: la URL apunta a cancha-total-prod. Esta preparación es solo para cancha-total-test.');
  process.exit(1);
}

if (!url.includes('cancha-total-test')) {
  console.error('ABORTADO: la URL no identifica claramente a cancha-total-test.');
  process.exit(1);
}

async function main() {
  const db = crearDb();
  await db.exec('DROP TABLE IF EXISTS reservas');
  console.log('cancha-total-test: tabla "reservas" eliminada (si existía). Lista para una corrida limpia.');
}

main().catch((err) => {
  console.error('Error preparando cancha-total-test:', err.message);
  process.exit(1);
});
