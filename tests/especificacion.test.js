// Suite de la red de seguridad del Caso 5 — Cancha Total F5.
//
// Cada prueba está derivada de una regla de ESPECIFICACION.md (se cita la sección
// entre corchetes en el nombre de la prueba) y NO del resultado actual del código:
// los valores esperados salen de lo que dice la administradora o, cuando ella no
// se pronuncia, de lo que ESPECIFICACION.md documenta como comportamiento actual
// conservado. Donde la especificación (administradora) y el comportamiento actual
// difieren (ver ESPECIFICACION.md §9), la prueba exige igual la regla de la
// administradora y HOY FALLA contra el proveedor: son pruebas normales, sin
// `todo` ni `skip` dentro del archivo. Los fallos conocidos se gestionan por
// fuera, en tests/fallos-esperados.json (vinculados a su HALLAZGO-XX en
// HALLAZGOS.md) y los reconoce verificar.sh. Esto permite que, el día que se
// corrija un hallazgo en server.js, la prueba correspondiente pase a verde sin
// cambiar ni una sola línea de este archivo — solo se actualiza el manifest y
// HALLAZGOS.md.
//
// Nivel declarado: todas las pruebas de este archivo son de integración (HTTP de
// extremo a extremo contra el servidor real). server.js no expone sus funciones
// internas (cálculo de precio, conteo de frecuencia, validaciones) como unidades
// probables de forma aislada sin tocar código de producción; esa imposibilidad de
// probar por unidad queda documentada como hallazgo de estructura en
// HALLAZGOS.md (ESTRUCTURA-01/02).

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  arrancarServidor,
  detenerServidor,
  hoyISO,
  postReserva,
  postCancelar,
  getDia,
  getInicio,
  getCotizar,
  idDeConfirmacion,
  precioDeConfirmacion,
} = require('./helpers');

test.before(async () => {
  await arrancarServidor();
});

test.after(async () => {
  await detenerServidor();
});

// --------------------------------------------------------------------------
// §1 Qué se alquila: dos canchas, bloques de una hora, rango 8:00-21:00
// --------------------------------------------------------------------------

test('[integración] RN-01 [§1.1] existen dos canchas independientes: reservar la 1 no ocupa la 2', async () => {
  const fecha = hoyISO(40);
  const r1 = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Cliente A', telefono: '88880040' });
  const r2 = await postReserva({ cancha: '2', fecha, hora: '9', cliente: 'Cliente B', telefono: '88880041' });
  assert.match(r1.texto, /Reserva #\d+ creada/, 'la reserva en cancha 1 debe crearse');
  assert.match(r2.texto, /Reserva #\d+ creada/, 'la misma fecha\/hora en cancha 2 debe crearse (son canchas distintas)');
});

test('[integración] RN-01b [§2.5, comportamiento actual] se rechaza una cancha distinta de 1 o 2', async () => {
  const fecha = hoyISO(40);
  const r = await postReserva({ cancha: '3', fecha, hora: '10', cliente: 'Cliente C', telefono: '88880042' });
  assert.match(r.texto, /La cancha debe ser 1 o 2/);
});

test('[integración] RN-02 [§1.2, comportamiento actual] el alquiler es por bloques de una hora: se rechaza una hora fraccionaria', async () => {
  const fecha = hoyISO(41);
  const r = await postReserva({ cancha: '1', fecha, hora: '9.5', cliente: 'Cliente D', telefono: '88880043' });
  assert.match(r.texto, /hora debe ser un bloque entre las 08:00 y las 21:00/);
});

test('[integración] RN-03 [§1.3] primer bloque a las 8:00: se acepta la hora 8 y se rechaza la 7', async () => {
  const fecha = hoyISO(42);
  const valido = await postReserva({ cancha: '1', fecha, hora: '8', cliente: 'Cliente E', telefono: '88880044' });
  const invalido = await postReserva({ cancha: '1', fecha, hora: '7', cliente: 'Cliente F', telefono: '88880045' });
  assert.match(valido.texto, /Reserva #\d+ creada/);
  assert.match(invalido.texto, /hora debe ser un bloque entre las 08:00 y las 21:00/);
});

test('[integración] RN-04 [§1.3] último bloque a las 21:00: se acepta la hora 21 y se rechaza la 22', async () => {
  const fecha = hoyISO(43);
  const valido = await postReserva({ cancha: '1', fecha, hora: '21', cliente: 'Cliente G', telefono: '88880046' });
  const invalido = await postReserva({ cancha: '1', fecha, hora: '22', cliente: 'Cliente H', telefono: '88880047' });
  assert.match(valido.texto, /Reserva #\d+ creada/);
  assert.match(invalido.texto, /hora debe ser un bloque entre las 08:00 y las 21:00/);
});

// --------------------------------------------------------------------------
// §2 Datos de una reserva
// --------------------------------------------------------------------------

test('[integración] RN-05 [§2.1] una reserva exige cancha, fecha, hora y nombre del cliente', async () => {
  const fecha = hoyISO(44);
  const sinCancha = await postReserva({ fecha, hora: '9', cliente: 'X', telefono: '88880048' });
  const sinFecha = await postReserva({ cancha: '1', hora: '9', cliente: 'X', telefono: '88880048' });
  const sinHora = await postReserva({ cancha: '1', fecha, cliente: 'X', telefono: '88880048' });
  const sinCliente = await postReserva({ cancha: '1', fecha, hora: '9', telefono: '88880048' });

  assert.match(sinCancha.texto, /Falta indicar la cancha/);
  assert.match(sinFecha.texto, /Falta la fecha/);
  assert.match(sinHora.texto, /Falta la hora de inicio/);
  assert.match(sinCliente.texto, /Falta el nombre del cliente/);
});

test(
  '[integración] RN-06 [§2.1, §2.2 — administradora] el teléfono es un dato obligatorio de la reserva',
  async () => {
    const fecha = hoyISO(45);
    const sinTelefono = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Cliente sin teléfono' });
    assert.match(sinTelefono.texto, /[Ff]alta.*tel[eé]fono/, 'debería rechazarse por falta de teléfono, según la administradora');
  }
);

test(
  '[integración] RN-07 [§2.3 — administradora] el teléfono debe tener exactamente 8 dígitos',
  async () => {
    const fecha = hoyISO(46);
    const corto = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'X', telefono: '123' });
    const largo = await postReserva({ cancha: '1', fecha, hora: '10', cliente: 'X', telefono: '123456789' });
    assert.match(corto.texto, /tel[eé]fono.*8 d[ií]gitos/i, 'un teléfono de 3 dígitos debería rechazarse');
    assert.match(largo.texto, /tel[eé]fono.*8 d[ií]gitos/i, 'un teléfono de 9 dígitos debería rechazarse');
  }
);

// --------------------------------------------------------------------------
// §3 Ocupación de un bloque
// --------------------------------------------------------------------------

test('[integración] RN-08 [§3.1] un bloque ocupado por una reserva activa no se vuelve a vender', async () => {
  const fecha = hoyISO(47);
  const primera = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Primero', telefono: '88880050' });
  assert.match(primera.texto, /Reserva #\d+ creada/);

  const segunda = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Segundo', telefono: '88880051' });
  assert.match(segunda.texto, /ya está ocupado/);
});

test('[integración] RN-09 [§3.2] una cancelación válida vuelve a liberar el bloque', async () => {
  const fecha = hoyISO(48);
  const creada = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Original', telefono: '88880052' });
  const id = idDeConfirmacion(creada.texto);
  assert.ok(id, 'debe haberse creado la reserva original');

  const cancelada = await postCancelar(id);
  assert.match(cancelada.texto, /cancelada/i);

  const reintento = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Nuevo cliente', telefono: '88880053' });
  assert.match(reintento.texto, /Reserva #\d+ creada/, 'el bloque debe quedar libre otra vez tras la cancelación');
});

// --------------------------------------------------------------------------
// §4 Precio de un bloque
// --------------------------------------------------------------------------

test('[integración] RN-10 [§4.1] la hora diurna (antes de las 17:00) cuesta ₡15.000', async () => {
  const cot = await getCotizar(16);
  assert.equal(cot.precio, 15000);

  const fecha = hoyISO(49);
  const reserva = await postReserva({ cancha: '1', fecha, hora: '16', cliente: 'Diurno', telefono: '88880054' });
  assert.equal(precioDeConfirmacion(reserva.texto), 15000);
});

test(
  '[integración] RN-11 [§4.2, §4.3 — administradora] desde las 17:00 inclusive el bloque cuesta ₡20.000',
  async () => {
    const cot = await getCotizar(17);
    assert.equal(cot.precio, 20000);

    const fecha = hoyISO(50);
    const reserva = await postReserva({ cancha: '1', fecha, hora: '17', cliente: 'Nocturno 17', telefono: '88880055' });
    assert.equal(precioDeConfirmacion(reserva.texto), 20000);
  }
);

test('[integración] RN-11b [§4.2, comportamiento actual y administradora coinciden] las 18:00 ya cuesta ₡20.000', async () => {
  const cot = await getCotizar(18);
  assert.equal(cot.precio, 20000);

  const fecha = hoyISO(51);
  const reserva = await postReserva({ cancha: '1', fecha, hora: '18', cliente: 'Nocturno 18', telefono: '88880056' });
  assert.equal(precioDeConfirmacion(reserva.texto), 20000);
});

// --------------------------------------------------------------------------
// §5 Cliente frecuente y descuento
// --------------------------------------------------------------------------

test('[integración] RN-12 [§5.2, §5.1] cuatro reservas del mismo mes con el mismo teléfono activan el 10% de descuento en la cuarta', async () => {
  const fecha = hoyISO(52);
  const telefono = '88880060';

  const r1 = await postReserva({ cancha: '1', fecha, hora: '8', cliente: 'Frecuente', telefono });
  const r2 = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Frecuente', telefono });
  const r3 = await postReserva({ cancha: '1', fecha, hora: '10', cliente: 'Frecuente', telefono });
  const r4 = await postReserva({ cancha: '1', fecha, hora: '11', cliente: 'Frecuente', telefono });

  assert.equal(precioDeConfirmacion(r1.texto), 15000, 'primera reserva del mes: sin descuento');
  assert.equal(precioDeConfirmacion(r2.texto), 15000, 'segunda reserva del mes: sin descuento');
  assert.equal(precioDeConfirmacion(r3.texto), 15000, 'tercera reserva del mes: sin descuento');
  assert.equal(precioDeConfirmacion(r4.texto), 13500, 'cuarta reserva del mes (contando la actual): 15000 con 10% de descuento');
  assert.match(r4.texto, /10% de descuento/);
});

test(
  '[integración] RN-13 [§5.3 — administradora] las reservas canceladas no cuentan para determinar cliente frecuente',
  async () => {
    const fecha = hoyISO(53);
    const telefono = '88880061';

    const c1 = await postReserva({ cancha: '1', fecha, hora: '8', cliente: 'Cancelador', telefono });
    const c2 = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Cancelador', telefono });
    const c3 = await postReserva({ cancha: '1', fecha, hora: '10', cliente: 'Cancelador', telefono });
    for (const r of [c1, c2, c3]) {
      const id = idDeConfirmacion(r.texto);
      await postCancelar(id);
    }

    // Con las 3 anteriores canceladas, esta es -según la administradora- apenas
    // la primera reserva activa del mes de este teléfono: no debería llevar
    // descuento (se necesitan 4 reservas que cuenten, y las canceladas no cuentan).
    const activa = await postReserva({ cancha: '1', fecha, hora: '11', cliente: 'Cancelador', telefono });
    assert.equal(precioDeConfirmacion(activa.texto), 15000, 'no debería aplicar descuento: solo hay 1 reserva activa este mes');
  }
);

// --------------------------------------------------------------------------
// §6 Cancelación de una reserva
// --------------------------------------------------------------------------

test('[integración] RN-14 [§6.1] se puede cancelar una reserva con más de 24 horas de anticipación', async () => {
  const fecha = hoyISO(5); // muy lejos en el futuro: inequívocamente ≥24h
  const creada = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Futuro lejano', telefono: '88880062' });
  const id = idDeConfirmacion(creada.texto);
  const cancelada = await postCancelar(id);
  assert.match(cancelada.texto, /Reserva #\d+ cancelada/);
});

test('[integración] RN-15 [§6.2] no se puede cancelar una reserva de hoy mismo (siempre queda menos de 24 horas)', async () => {
  const fecha = hoyISO(0);
  const creada = await postReserva({ cancha: '2', fecha, hora: '21', cliente: 'Hoy mismo', telefono: '88880063' });
  const id = idDeConfirmacion(creada.texto);
  const rechazada = await postCancelar(id);
  assert.match(rechazada.texto, /no se puede cancelar/);
});

test(
  '[integración] RN-16 [§6.2 — administradora, ventana exacta de 24h] una reserva de mañana a las 8:00 solo debería poder cancelarse si faltan 24 horas reales o más',
  async () => {
    // server.js no permite inyectar un reloj sin tocar código de producción, así
    // que esta prueba no fija una fecha/hora "de mentira": calcula, a partir del
    // instante real en que corre, cuántas horas exactas faltan hasta el primer
    // bloque (08:00) del día siguiente y deriva de ahí el valor esperado según la
    // regla de la administradora (ESPECIFICACION.md §6.1/§6.2: cancelable hasta
    // 24h antes, inclusive; con menos de 24h no se cancela). El resultado no
    // depende de qué fecha sea "hoy" ni de si la ejecución cruza la medianoche:
    // se reconstruye la aritmética completa (año/mes/día/hora) con el objeto
    // Date nativo en cada corrida.
    //
    // server.js y este proceso de pruebas corren como procesos Node del mismo
    // sistema operativo (ver tests/helpers.js), así que ambos usan la misma zona
    // horaria local — no hay conversión de huso horario que alinear a mano.
    //
    // Límite real de esta prueba (documentado también en HALLAZGOS.md y en
    // tests/fallos-esperados.json): con bloques que solo existen entre las 8:00 y
    // las 21:00, es matemáticamente imposible construir un bloque "de mañana"
    // con menos de 24h reales de anticipación cuando la prueba corre entre las
    // 00:00 y las 08:00 de hoy (el bloque más temprano de mañana, 08:00, ya
    // queda a 24h o más). En esa franja el código y la especificación coinciden
    // por construcción del calendario, no porque el hallazgo se haya corregido;
    // fuera de esa franja (las otras ~16 horas del día), el hallazgo sí se
    // manifiesta y la prueba falla como se espera.
    const ahora = new Date();
    const primerBloqueDeManana = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate() + 1,
      8, 0, 0, 0
    );
    const horasReales = (primerBloqueDeManana.getTime() - ahora.getTime()) / 3_600_000;
    const esperaCancelacionPermitida = horasReales >= 24;

    const fecha = hoyISO(1);
    const creada = await postReserva({ cancha: '1', fecha, hora: '8', cliente: 'Mañana temprano', telefono: '88880064' });
    const id = idDeConfirmacion(creada.texto);
    const resultado = await postCancelar(id);

    if (esperaCancelacionPermitida) {
      assert.match(resultado.texto, /Reserva #\d+ cancelada/, `faltan ${horasReales.toFixed(2)}h reales (≥24h): la cancelación sí debe permitirse`);
    } else {
      assert.match(resultado.texto, /no se puede cancelar/, `faltan ${horasReales.toFixed(2)}h reales (<24h): la administradora exige rechazar la cancelación`);
    }
  }
);

test('[integración] RN-16b [§6.3, §6.4, comportamiento actual] cancelar una reserva inexistente o ya cancelada se informa como tal', async () => {
  const noExiste = await postCancelar(999999);
  assert.match(noExiste.texto, /No existe la reserva/);

  const fecha = hoyISO(6);
  const creada = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Doble cancelación', telefono: '88880065' });
  const id = idDeConfirmacion(creada.texto);
  await postCancelar(id);
  const segundaVez = await postCancelar(id);
  assert.match(segundaVez.texto, /ya estaba cancelada/);
});

// --------------------------------------------------------------------------
// §7 Visualización de reservas de un día
// --------------------------------------------------------------------------

test('[integración] RN-17 [§7.1] la disponibilidad diaria se puede consultar por cancha', async () => {
  const fecha = hoyISO(54);
  await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Ocupante', telefono: '88880066' });

  const vista = await getInicio(fecha);
  // La fila de las 9:00 debe verse ocupada en Cancha 1 y libre en Cancha 2.
  // (No se puede partir por el texto "Cancha 2" a secas: también aparece antes,
  // en el enlace del menú de navegación.)
  const bloqueCancha1 = vista.texto.split('<h3>Cancha 2</h3>')[0];
  const bloqueCancha2 = vista.texto.split('<h3>Cancha 2</h3>')[1];
  assert.match(bloqueCancha1, /9:00<\/td><td class="ocupado">Ocupado/);
  assert.match(bloqueCancha2, /9:00<\/td><td class="libre">Libre/);
});

test('[integración] RN-18 [§7.2] el listado de reservas del día muestra el importe cobrado en cada una', async () => {
  const fecha = hoyISO(55);
  const creada = await postReserva({ cancha: '1', fecha, hora: '9', cliente: 'Cliente Listado', telefono: '88880067' });
  assert.match(creada.texto, /Reserva #\d+ creada/);

  const dia = await getDia(fecha);
  assert.match(dia.texto, /Cliente Listado/);
  assert.match(dia.texto, /₡15\.000/);
});

test('[integración] RN-18b [§7.3, §7.5, comportamiento actual] el listado del día incluye canceladas y avisa si no hay reservas', async () => {
  const fechaConDatos = hoyISO(56);
  const creada = await postReserva({ cancha: '1', fecha: fechaConDatos, hora: '9', cliente: 'Se cancela', telefono: '88880068' });
  const id = idDeConfirmacion(creada.texto);
  await postCancelar(id);

  const dia = await getDia(fechaConDatos);
  assert.match(dia.texto, /Se cancela/, 'la reserva cancelada debe seguir apareciendo en el listado');
  assert.match(dia.texto, /cancelada/);

  const fechaVacia = hoyISO(365);
  const diaVacio = await getDia(fechaVacia);
  assert.match(diaVacio.texto, /No hay reservas para esta fecha/);
});
