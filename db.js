// Adaptador de persistencia para Cancha Total F5.
//
// Expone una única interfaz async (exec/get/all/run) para que server.js no
// necesite saber contra qué motor habla:
//
// - Local y GitHub Actions (sin TURSO_DATABASE_URL/TURSO_AUTH_TOKEN): SQLite
//   local con better-sqlite3, exactamente como antes, envuelto en promesas.
// - Producción en Vercel (con esas dos variables presentes): Turso, vía
//   @tursodatabase/serverless (HTTP puro, sin bindings nativos).
//
// Si Vercel (VERCEL=1) arranca sin las variables de Turso, se falla de forma
// explícita en vez de escribir silenciosamente en el filesystem efímero.

const path = require('path');

function adaptadorLocal() {
  const Database = require('better-sqlite3');
  const db = new Database(path.join(__dirname, 'reservas.db'));

  return {
    async exec(sql) {
      db.exec(sql);
    },
    async get(sql, ...params) {
      return db.prepare(sql).get(...params);
    },
    async all(sql, ...params) {
      return db.prepare(sql).all(...params);
    },
    async run(sql, ...params) {
      const info = db.prepare(sql).run(...params);
      return { lastInsertRowid: info.lastInsertRowid };
    },
  };
}

function adaptadorTurso(url, authToken) {
  const { connect } = require('@tursodatabase/serverless');
  const conn = connect({ url, authToken });

  return {
    async exec(sql) {
      await conn.exec(sql);
    },
    async get(sql, ...params) {
      return conn.get(sql, ...params);
    },
    async all(sql, ...params) {
      return conn.all(sql, ...params);
    },
    async run(sql, ...params) {
      const resultado = await conn.run(sql, ...params);
      return {
        lastInsertRowid:
          resultado.lastInsertRowid !== undefined ? Number(resultado.lastInsertRowid) : undefined,
      };
    },
  };
}

function crearDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url || authToken) {
    if (!url || !authToken) {
      throw new Error(
        'Faltan variables de Turso: TURSO_DATABASE_URL y TURSO_AUTH_TOKEN deben estar definidas juntas.'
      );
    }
    return adaptadorTurso(url, authToken);
  }

  if (process.env.VERCEL === '1') {
    throw new Error(
      'Faltan TURSO_DATABASE_URL y TURSO_AUTH_TOKEN: producción en Vercel requiere Turso y no puede usar SQLite local.'
    );
  }

  return adaptadorLocal();
}

module.exports = { crearDb };
