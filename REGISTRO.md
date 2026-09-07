# Registro — Caso práctico 7

Se verificó una discrepancia entre la consigna (cerrar H-2 a H-8) y el repositorio real: nunca existieron hallazgos H-5 a H-8 ni H-11, así que no se inventaron y tampoco se tocó estructura (`ESTRUCTURA-01`/`02`).
Con el subagente `cierre-hallazgos`, agrupando por zona de comportamiento en `server.js` (teléfono, cliente frecuente, ventana de cancelación de 24h), se corrigieron `HALLAZGO-02`, `HALLAZGO-03` y `HALLAZGO-04`.
El entorno local no pudo ejecutar la suite (`better-sqlite3` compilado para otra versión de Node, sin Visual Studio Build Tools), así que la validación real se hizo vía CI en GitHub Actions (PR #4, Node 22).
El primer CI falló con 0 regresiones reales porque los tres hallazgos ya estaban corregidos pero seguían en `tests/fallos-esperados.json`.
Este commit retira esas entradas del manifest y marca los tres hallazgos de comportamiento como cerrados en `HALLAZGOS.md`.
