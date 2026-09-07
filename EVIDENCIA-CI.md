# Evidencia — la puerta de CI detecta una regresión real

Esta rama (`caso6/evidencia-rojo-verde`) existe únicamente para demostrar, con un caso real
y no simulado, que la puerta de integración continua (`verificar.sh`, ejecutada por el check
`verificar` del workflow `CI`) distingue correctamente entre:

- los cuatro hallazgos abiertos ya documentados en `HALLAZGOS.md` y declarados en
  `tests/fallos-esperados.json` (que no deben hacer fallar la puerta), y
- una regresión nueva, no manifestada, que sí debe hacerla fallar.

## Commit 1 — regresión controlada (rojo)

Se revirtió intencionalmente el umbral de tarifa nocturna en `precioDelBloque` (`server.js`),
de `hora >= 17` a `hora >= 18` — exactamente el defecto que documentaba `HALLAZGO-01`, ya
cerrado. Esto rompe `RN-11` (`[§4.2, §4.3 — administradora] desde las 17:00 inclusive el
bloque cuesta ₡20.000`), que hoy pasa en verde y **no** está en `tests/fallos-esperados.json`.
No se tocó ningún hallazgo abierto, ni el manifest, ni las pruebas, ni el workflow.

Resultado esperado: `verificar.sh` sale con código `2`, reportando `RN-11` como una regresión
real (no manifestada), mientras los cuatro hallazgos abiertos (`HALLAZGO-02`, `HALLAZGO-03`,
`HALLAZGO-04`) siguen reconocidos como tales.

## Commit 2 — reparación (verde)

Se restauró `hora >= 17` en `precioDelBloque`, dejando `server.js` exactamente como estaba
antes de esta rama. `verificar.sh` vuelve a salir con código `0`: 22 pruebas evaluadas, 18
pasan, 4 fallan únicamente por los hallazgos abiertos conocidos, 0 regresiones reales.

## Resultado observado

- El primer commit de esta rama produjo la corrida roja: el check `verificar` del PR quedó en
  `failure`, con `RN-11` reportada como regresión real no manifestada, y la protección de
  `main` bloqueó la fusión (`mergeStateStatus: BLOCKED`) mientras ese check no estaba en verde.
- Este segundo commit repara exactamente esa regresión. El check `verificar` vuelve a `success`
  y la puerta vuelve a aceptar únicamente los cuatro hallazgos abiertos conocidos.
