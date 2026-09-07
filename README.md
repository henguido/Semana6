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
