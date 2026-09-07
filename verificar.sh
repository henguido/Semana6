#!/usr/bin/env bash
# Puerta de verificación de un solo comando para el Caso 5 — Cancha Total F5.
#
# Corre la suite completa (todas pruebas normales, sin `todo` ni `skip`) y cruza
# el resultado contra tests/fallos-esperados.json, el manifest explícito de
# fallos esperados vinculado a HALLAZGOS.md. La lógica de esa comparación vive en
# tests/verificar-resultado.js; ver ese archivo para las reglas exactas.
#
# Contrato de salida de ESTA interfaz (verificar.sh), tal como lo exige la
# consigna: SOLO 0 o 2, nunca otro valor.
#   0 -> verificación aceptable: no hay regresiones inesperadas y todos los
#        fallos observados corresponden exactamente con hallazgos abiertos
#        declarados en tests/fallos-esperados.json.
#   2 -> verificación NO aceptable: regresión inesperada, inconsistencia del
#        manifest, pase inesperado de un hallazgo todavía declarado abierto,
#        error al instalar dependencias, error del runner de pruebas, o
#        cualquier otra situación que impida considerar verde la puerta.
#
# El runner interno (node --test, tests/verificar-resultado.js) puede terminar
# con el código que sea internamente; esta interfaz normaliza cualquier
# resultado que no sea "aceptable" a exactamente 2.
#
# Requiere Node.js con soporte para node:test (Node 18+) y las dependencias del
# proyecto instaladas (better-sqlite3 necesita un binario compatible con la
# versión de Node usada; ver README.md).

set -u
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -d node_modules ]; then
  echo "== node_modules no existe: instalando dependencias (npm install) =="
  if ! npm install; then
    echo "ERROR: no se pudieron instalar las dependencias. Ver el error de npm arriba."
    exit 2
  fi
fi

SALIDA_TAP="$(mktemp)"
trap 'rm -f "$SALIDA_TAP"' EXIT

echo "== Ejecutando la suite (node --test) =="
node --test --test-reporter=tap tests/*.test.js > "$SALIDA_TAP" 2>&1

echo
node tests/verificar-resultado.js "$SALIDA_TAP" tests/fallos-esperados.json
CODIGO_INTERNO=$?

if [ "$CODIGO_INTERNO" -eq 0 ]; then
  exit 0
else
  exit 2
fi
