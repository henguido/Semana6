# Hallazgos — Cancha Total F5

Registro de discrepancias descubiertas por la suite de pruebas (`tests/especificacion.test.js`)
entre la especificación reconstruida (`ESPECIFICACION.md`) y el sistema entregado por el
proveedor (commit `65ce4b4`), más las deudas de estructura detectadas al escribir esa suite.

Ningún hallazgo de comportamiento se corrige en este bloque: los cuatro están abiertos. Cada uno
tiene una prueba **normal** (sin `todo` ni `skip`) que hoy falla contra el código del proveedor
porque exige la regla de la administradora; el vínculo prueba↔hallazgo vive fuera de la suite, en
`tests/fallos-esperados.json`, que es lo que lee `verificar.sh` para no tratar esos fallos
conocidos como regresión. El día que se corrija un hallazgo, su prueba pasa a verde sin tocarse:
solo hay que quitar la entrada correspondiente de `tests/fallos-esperados.json` y actualizar el
estado aquí a "cerrado" con su evidencia.

---

## HALLAZGO-01 — Tarifa nocturna empieza a las 18:00, no a las 17:00

- **Clase:** comportamiento
- **Regla de especificación relacionada:** ESPECIFICACION.md §4.3 (administradora) / §9.1
- **Prueba que lo evidencia:** `RN-11` en `tests/especificacion.test.js`
- **Comportamiento esperado (administradora):** el bloque de las 17:00 ya se cobra con tarifa
  nocturna, ₡20.000.
- **Comportamiento observado:** `server.js` aplica la tarifa nocturna solo desde `hora >= 18`
  (líneas 127, 280 y 369). El bloque de las 17:00 se cobra como diurno, ₡15.000.
- **Estado:** abierto
- **Evidencia de cierre:** —

## HALLAZGO-02 — El teléfono no es obligatorio ni se valida su formato

- **Clase:** comportamiento
- **Regla de especificación relacionada:** ESPECIFICACION.md §2.2, §2.3 (administradora) / §9.2
- **Prueba que lo evidencia:** `RN-06` y `RN-07` en `tests/especificacion.test.js`
- **Comportamiento esperado (administradora):** el teléfono es obligatorio y debe tener
  exactamente 8 dígitos.
- **Comportamiento observado:** la validación de `POST /reservas` (líneas 240-263 de
  `server.js`) no incluye ninguna regla sobre `telefono`: una reserva se crea igual sin
  teléfono o con un teléfono de cualquier longitud.
- **Estado:** abierto
- **Evidencia de cierre:** —

## HALLAZGO-03 — Las reservas canceladas cuentan para determinar cliente frecuente

- **Clase:** comportamiento
- **Regla de especificación relacionada:** ESPECIFICACION.md §5.3 (administradora) / §9.3
- **Prueba que lo evidencia:** `RN-13` en `tests/especificacion.test.js`
- **Comportamiento esperado (administradora):** las reservas canceladas no cuentan para decidir
  si un cliente es frecuente ese mes.
- **Comportamiento observado:** el conteo de `POST /reservas` (líneas 289-292 de `server.js`)
  cuenta todas las reservas del teléfono en el mes, sin filtrar por `estado`. Tres reservas
  canceladas + una nueva activa ya activan el 10% de descuento, cuando según la administradora
  la nueva reserva sería apenas la primera activa del mes.
- **Estado:** abierto
- **Evidencia de cierre:** —

## HALLAZGO-04 — La ventana de cancelación de 24 horas se mide por fecha calendario, no por hora exacta

- **Clase:** comportamiento
- **Regla de especificación relacionada:** ESPECIFICACION.md §6.1, §6.2 (administradora) / §9.4
- **Prueba que lo evidencia:** `RN-16` en `tests/especificacion.test.js`
- **Comportamiento esperado (administradora):** se puede cancelar hasta 24 horas antes de la
  hora exacta del bloque; con menos de 24 horas reales de anticipación no se permite cancelar.
- **Comportamiento observado:** `POST /reservas/:id/cancelar` (línea 330 de `server.js`) solo
  compara `reserva.fecha > hoyFecha`, sin considerar la hora del bloque ni la hora actual. Una
  reserva de "mañana" siempre se puede cancelar hoy, aunque en la práctica falten menos de 24
  horas reales para el bloque (p. ej. reservar mañana a las 8:00 y cancelar hoy a las 20:00, con
  solo 12 horas de por medio).
- **Estado:** abierto
- **Evidencia de cierre:** —
- **Nota sobre la prueba (`RN-16`):** calcula en tiempo de ejecución, con aritmética de fechas
  completa (año/mes/día/hora, sin asumir qué fecha es "hoy" ni si la corrida cruza la
  medianoche), cuántas horas reales faltan hasta el primer bloque de mañana (08:00), y deriva de
  ahí el valor esperado según la regla de la administradora. Es matemáticamente imposible construir
  un bloque "de mañana" con menos de 24h reales de anticipación cuando la suite corre entre las
  00:00 y las 08:00 de hoy (el bloque más temprano de mañana, 08:00, ya queda a 24h o más en esa
  franja): en esa ventana el código y la especificación coinciden por construcción del calendario,
  no porque el hallazgo se haya corregido. Esa ventana está declarada explícitamente en
  `tests/fallos-esperados.json` (`exentoSiHoraLocalMenorQue: 8`) para que `verificar.sh` no la
  confunda con un cierre real. Fuera de esa ventana (~16 de las 24 horas del día), la prueba falla
  como se espera y evidencia el hallazgo.

---

## ESTRUCTURA-01 — El cálculo de precio está triplicado

- **Clase:** estructura
- **Regla de especificación relacionada:** ESPECIFICACION.md §4 (no es una regla de negocio en
  sí, es una deuda técnica alrededor de esa regla)
- **Prueba que lo evidencia:** ninguna prueba falla por esto — es una observación de lectura de
  código, confirmada al escribir `RN-10`/`RN-11`/`RN-11b`, que tuvieron que verificar el mismo
  cálculo en tres puntos distintos del sistema para tener cobertura completa.
- **Comportamiento esperado:** el corte de tarifa (`>= 17` según la administradora, hoy
  `>= 18`) debería vivir en un único lugar.
- **Comportamiento observado:** la misma lógica `if (hora >= 18) precio = 20000; else precio =
  15000;` está copiada de forma casi idéntica en tres puntos de `server.js`: la vista de
  disponibilidad (`GET /`, líneas 126-131), la creación de una reserva (`POST /reservas`, líneas
  278-284) y la cotización rápida (`GET /api/cotizar`, líneas 368-373). El commit del proveedor
  (`65ce4b4`) ya tenía comentarios señalando esto ("copia 1 de 3", "copia 2 de 3", "copia 3 de
  3" — visibles en el commit previo al amend, `09a51f9`, y confirmados con `git diff 09a51f9
  65ce4b4`).
- **Riesgo concreto:** al cerrar el HALLAZGO-01 (mover el corte de tarifa a las 17:00) hay que
  recordar tocar los tres lugares; si se corrige solo uno, el sistema queda con tarifas
  inconsistentes entre la disponibilidad, la cotización y el cobro real.
- **Estado:** abierto

## ESTRUCTURA-02 — Las rutas de disponibilidad por cancha están duplicadas

- **Clase:** estructura
- **Regla de especificación relacionada:** ESPECIFICACION.md §1.5 (comportamiento actual:
  "cada cancha también tiene su propia vista individual de disponibilidad")
- **Prueba que lo evidencia:** ninguna prueba falla por esto — observación de lectura de código.
- **Comportamiento esperado:** una sola ruta parametrizada (`/disponibilidad/:cancha`) en vez de
  dos rutas casi idénticas.
- **Comportamiento observado:** `app.get('/disponibilidad/cancha1', ...)` y
  `app.get('/disponibilidad/cancha2', ...)` (líneas 191-225 de `server.js`) son copias casi
  exactas entre sí, cambiando solo el número de cancha fijo y el título. El commit previo al
  amend del proveedor (`09a51f9`) tenía un comentario explícito sobre esto ("Copiados casi tal
  cual en vez de una sola ruta con parámetro"), que el amend eliminó sin cambiar el código.
- **Estado:** abierto
