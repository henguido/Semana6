# Cancha Total F5 — Sistema de reservas

Sistema de reservas para las dos canchas techadas de fútbol 5 de Cancha Total F5.
Permite ver la disponibilidad del día, registrar reservas y cancelarlas.

## Instalación

Se recomienda **Node.js 22 LTS**. `better-sqlite3` compila un binario nativo al instalarse;
en algunas máquinas Windows con Node 24 no hay binario precompilado disponible y falta la
cadena de compilación (Visual Studio Build Tools) para construirlo desde código fuente. Con
Node 22 LTS la instalación funciona sin pasos adicionales.

```
npm install
```

## Datos de prueba

Borra `reservas.db` (si existe) y la recrea con reservas de ejemplo:

```
npm run datos
```

## Arrancar el servidor

```
npm start
```

El servidor queda escuchando en el puerto 3000: http://localhost:3000

## Ejecutar la verificación

El proyecto tiene una suite de pruebas (`tests/`) y una puerta de verificación de un solo
comando, `verificar.sh`, en la raíz.

```
./verificar.sh        # Linux/macOS
bash verificar.sh      # Windows (Git Bash)
```

Código de salida:
- `0` — la suite solo contiene los hallazgos abiertos ya documentados en `HALLAZGOS.md`.
- `2` — hay una regresión inesperada, una inconsistencia del manifest de hallazgos esperados
  (`tests/fallos-esperados.json`), o cualquier otra situación que no permita considerar verde
  la puerta.

## Integración continua

El workflow `.github/workflows/ci.yml` corre en cada `push` y en cada `pull_request`, sobre una
máquina limpia (`ubuntu-latest`), con Node 22 y sin credenciales de servicios externos. Instala
las dependencias con `npm ci` (desde `package-lock.json`) y la puerta que decide si el estado es
aceptable es la misma heredada del Caso 5: `bash verificar.sh`. No se usa `npm test` ni
`node --test` directamente como puerta, porque `verificar.sh` es quien distingue los cuatro
hallazgos abiertos ya documentados en `HALLAZGOS.md` de una regresión real.

- Los cuatro hallazgos abiertos (`HALLAZGO-02`, `HALLAZGO-03`, `HALLAZGO-04`) pueden seguir
  fallando en la suite sin que eso convierta la puerta en roja: `verificar.sh` sale con código
  `0` mientras esos fallos coincidan exactamente con `tests/fallos-esperados.json`.
- Cualquier fallo nuevo, no manifestado en `tests/fallos-esperados.json`, hace que `verificar.sh`
  salga con código `2` y la puerta quede roja.
- El check requerido para poder fusionar a `main` es el job **`verificar`** del workflow **`CI`**.
  Únicamente ese check, configurado como *required status check* en la protección de la rama,
  bloquea el merge. Cualquier otro check o estado que no esté marcado como requerido es solo
  informativo y no impide fusionar.
