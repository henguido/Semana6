# Especificación — Cancha Total F5

Fuente de verdad reconstruida a partir de la descripción de la administradora. Donde ella no
especifica algo, se usa el comportamiento actual observado del sistema, marcado como tal. Cuando
ambas fuentes hablan del mismo punto y difieren, se conserva la regla de la administradora y se
deja constancia de la diferencia (ver sección 9).

Cada afirmación declara su fuente entre paréntesis: **(administradora)** o
**(comportamiento actual)**.

---

## 1. Qué se alquila

1. El negocio alquila dos canchas techadas de fútbol 5. **(administradora)**
2. El alquiler es por bloques de una hora, todos los días de la semana. **(administradora)**
3. El primer bloque del día empieza a las 8:00 y el último empieza a las 21:00, en cualquiera de
   las dos canchas. **(administradora)**
4. La disponibilidad de un día se puede consultar para ambas canchas juntas en una sola vista,
   por defecto la del día actual si no se indica una fecha. **(comportamiento actual)**
5. Cada cancha también tiene su propia vista individual de disponibilidad. **(comportamiento actual)**
6. La disponibilidad se presenta bloque por bloque (una fila por hora). **(comportamiento actual)**

## 2. Datos de una reserva

1. Una reserva lleva cancha, fecha, hora, nombre del cliente y teléfono. **(administradora)**
2. El teléfono es un dato obligatorio de la reserva. **(administradora)**
3. El teléfono debe tener 8 dígitos. **(administradora)**
4. El teléfono es la forma de ubicar al cliente y de reconocerlo como cliente frecuente.
   **(administradora)**
5. Al crear una reserva se validan también la cancha, la fecha, la hora y el nombre del cliente:
   - Se rechaza una cancha que no sea la 1 o la 2. **(comportamiento actual)**
   - Se rechaza una fecha faltante o que no tenga el formato AAAA-MM-DD. **(comportamiento actual)**
   - Se rechaza una hora faltante o que esté fuera del rango de las 8 a las 21.
     **(comportamiento actual)**
   - Se rechaza un nombre de cliente faltante. **(comportamiento actual)**

## 3. Ocupación de un bloque

1. Un bloque ocupado por una reserva activa no se vuelve a vender: no se puede crear una segunda
   reserva para la misma cancha, la misma fecha y la misma hora mientras la primera siga activa.
   **(administradora, confirmado también por el comportamiento actual)**
2. Si alguien cancela a tiempo, ese espacio queda libre otra vez y puede volver a reservarse.
   **(administradora)**

## 4. Precio de un bloque

1. La hora diurna cuesta ₡15.000. **(administradora)**
2. Desde que se enciende la luz, el bloque cuesta ₡20.000. **(administradora)**
3. La luz se enciende a las 5 de la tarde (17:00); el bloque de las 17:00 ya se cobra con tarifa
   de luz (₡20.000). **(administradora)** — ver diferencia con el comportamiento actual en la
   sección 9.
4. Existe una cotización rápida que, dada una hora, devuelve el precio de ese bloque antes de
   enviar el formulario de reserva. **(comportamiento actual)**

## 5. Cliente frecuente y descuento

1. El cliente frecuente recibe un 10% de descuento sobre el precio del bloque que está reservando.
   **(administradora)**
2. Cliente frecuente significa tener cuatro o más reservas en el mismo mes calendario, contando
   la reserva que se está haciendo en ese momento. **(administradora)**
3. Las reservas canceladas no cuentan para determinar si el cliente es frecuente.
   **(administradora)** — ver diferencia con el comportamiento actual en la sección 9.
4. El conteo de reservas del mes se hace por teléfono, ya que el teléfono es lo que identifica al
   cliente. **(administradora)**

## 6. Cancelación de una reserva

1. Una reserva se puede cancelar hasta 24 horas antes de la hora del partido. **(administradora)**
2. Con menos de 24 horas de anticipación no se permite cancelar, y el bloque se cobra completo.
   **(administradora)** — ver diferencia con el comportamiento actual en la sección 9.
3. Si la reserva no existe, se informa que no existe. **(comportamiento actual)**
4. Si la reserva ya estaba cancelada, se informa que ya lo estaba. **(comportamiento actual)**

## 7. Visualización de reservas de un día

1. Para cada día se puede ver qué bloques están libres en cada cancha. **(administradora)**
2. Para cada día se puede ver la lista de reservas de ese día, con lo que se cobró en cada una.
   **(administradora)**
3. El listado de reservas del día incluye tanto las activas como las canceladas.
   **(comportamiento actual)**
4. Las reservas canceladas se muestran marcadas visualmente como tachadas y sin la opción de
   cancelar (porque ya están canceladas). **(comportamiento actual)**
5. Si no hay reservas para una fecha, se muestra un mensaje indicando que no hay reservas ese día.
   **(comportamiento actual)**

## 8. Confirmación al crear una reserva

1. Al crear una reserva con éxito, se muestra el número de la reserva, la cancha, la fecha, la
   hora, el nombre del cliente y el precio final cobrado. **(comportamiento actual)**

## 9. Puntos donde la administradora y el comportamiento actual difieren

En estos puntos ambas fuentes hablan de lo mismo pero no coinciden. Esta especificación se queda
con la regla de la administradora; la diferencia queda documentada aquí para que el siguiente
paso (pruebas) pueda evidenciarla como hallazgo, sin corregir nada todavía.

1. **Hora en que empieza a cobrarse la tarifa de luz.** La administradora dice que la luz se
   enciende a las 5 de la tarde y que el bloque de las 17:00 ya se cobra con tarifa nocturna
   (₡20.000). El comportamiento actual observado cobra tarifa nocturna solo desde las 18:00 en
   adelante; el bloque de las 17:00 se cobra hoy como diurno (₡15.000). **Fuente elegida:
   administradora.**
2. **Teléfono obligatorio y con 8 dígitos.** La administradora dice que el teléfono es
   obligatorio y de 8 dígitos. El comportamiento actual observado no exige el teléfono ni valida
   su formato: una reserva se puede crear sin teléfono o con un teléfono de cualquier longitud.
   **Fuente elegida: administradora.**
3. **Reservas canceladas y cliente frecuente.** La administradora dice que las reservas
   canceladas no cuentan para determinar si un cliente es frecuente. El comportamiento actual
   observado cuenta todas las reservas del teléfono en el mes, sin importar si están activas o
   canceladas, para decidir el descuento. **Fuente elegida: administradora.**
4. **Ventana de cancelación de 24 horas.** La administradora dice que la cancelación se permite
   hasta 24 horas antes de la hora del partido (una medida de tiempo exacta, que depende de la
   fecha y también de la hora del bloque). El comportamiento actual observado solo compara la
   fecha de la reserva contra la fecha de hoy, sin considerar la hora del bloque ni la hora
   actual: cualquier reserva de una fecha futura se puede cancelar, y ninguna reserva del día de
   hoy se puede cancelar, independientemente de cuántas horas falten realmente para el bloque.
   **Fuente elegida: administradora.**

## 10. Comportamientos no especificados por la administradora (comportamiento actual)

Comportamientos que el sistema tiene hoy y sobre los que la administradora no se pronunció. Se
consideran correctos mientras no se indique lo contrario:

- La página de inicio muestra ambas canchas para una fecha dada, por defecto el día actual.
- Cada cancha tiene además su propia página individual de disponibilidad.
- La disponibilidad se presenta bloque por bloque.
- Al crear una reserva se validan la cancha (debe ser 1 o 2), la fecha (formato AAAA-MM-DD) y la
  hora (entero entre 8 y 21), además del nombre del cliente.
- Se rechaza la creación de una reserva si ya existe una reserva activa para la misma cancha,
  fecha y hora.
- Al crear una reserva exitosa se muestra el número de reserva, cancha, fecha, hora, cliente y
  precio final.
- El listado de reservas de un día muestra tanto las activas como las canceladas; las canceladas
  aparecen tachadas y sin botón de cancelar.
- Si no hay reservas para una fecha, se muestra un mensaje indicándolo.
- Existe una cotización rápida de precio, usada por el formulario de reserva antes de enviarlo.
- Los datos viven en una base de datos SQLite (`reservas.db`), que se puede recrear con datos de
  ejemplo mediante un script aparte.

## 11. Código presente pero inactivo

Código que existe en el sistema pero no se ejecuta en ningún recorrido actual. No se convierte en
requisito ni se prueba como comportamiento esperado:

- Una función relacionada con feriados, que no se usa en ninguna parte del sistema.
- Reglas de precio de temporada alta, dejadas comentadas y sin usar.
