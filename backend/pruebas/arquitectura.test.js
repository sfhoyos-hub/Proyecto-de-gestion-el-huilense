// Pruebas de la arquitectura y de los patrones. Ejecutar: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { registrar, implementar } = require('../dominio/puertos/registro');
const IRepositorio = require('../dominio/puertos/IRepositorio');
const Mesero = require('../dominio/usuarios/Mesero');
const Domingo = require('../dominio/ventas/Domingo');
const { Convocatoria } = require('../dominio/convocatoria');
const { DatosNequi } = require('../dominio/pagos');
const EstrategiaPorRendimiento = require('../negocio/convocatoria/estrategias/EstrategiaPorRendimiento');
const EstrategiaPorAntiguedad = require('../negocio/convocatoria/estrategias/EstrategiaPorAntiguedad');
const { GestorNotificaciones } = require('../negocio/notificaciones/GestorNotificaciones');
const Observador = require('../dominio/usuarios/Observador');
const { Notificacion } = require('../dominio/notificaciones');
const { NequiAdapter } = require('../infraestructura/nequi/NequiAdapter');

function archivosJs(carpeta) {
    return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
        const ruta = path.join(carpeta, e.name);
        return e.isDirectory() ? archivosJs(ruta) : ruta.endsWith('.js') ? [ruta] : [];
    });
}

function importaDe(capa, prohibida) {
    return archivosJs(path.join(__dirname, '..', capa)).filter((archivo) =>
        new RegExp(`require\\(['"][./]*${prohibida}/`).test(fs.readFileSync(archivo, 'utf8')));
}

test('las dependencias entre capas apuntan hacia el dominio', () => {
    assert.deepStrictEqual(importaDe('negocio', 'infraestructura'), []);
    assert.deepStrictEqual(importaDe('aplicacion', 'infraestructura'), []);
    assert.deepStrictEqual(importaDe('dominio', 'negocio'), []);
    assert.deepStrictEqual(importaDe('dominio', 'infraestructura'), []);
    assert.deepStrictEqual(importaDe('dominio', 'aplicacion'), []);
});

test('el registro rechaza adaptadores que no implementan el puerto', () => {
    assert.throws(() => registrar('x', {}, IRepositorio), /no implementa/);
    assert.throws(() => registrar('x', implementar(IRepositorio, {}), IRepositorio), /enTransaccion/);
});

const meseros = [
    new Mesero({ meseroId: 1, nombre: 'A', apellido: '', fechaIngreso: '2024-01-01' }),
    new Mesero({ meseroId: 2, nombre: 'B', apellido: '', fechaIngreso: '2020-01-01' }),
    new Mesero({ meseroId: 3, nombre: 'C', apellido: '', fechaIngreso: '2022-01-01' })
];
const candidatos = [
    { mesero: meseros[0], totalReciente: 500 },
    { mesero: meseros[1], totalReciente: 100 },
    { mesero: meseros[2], totalReciente: 500 }
];
const ids = (lista) => lista.map((m) => m.meseroId);

test('Strategy: por rendimiento (empate por antigüedad) y por antigüedad', () => {
    assert.deepStrictEqual(ids(new EstrategiaPorRendimiento().ordenar(candidatos, '2026-11-08')), [3, 1, 2]);
    assert.deepStrictEqual(ids(new EstrategiaPorAntiguedad().ordenar(candidatos, '2026-11-08')), [2, 3, 1]);
});

test('Convocatoria: los primeros N quedan convocados y el resto en descanso', () => {
    const domingo = new Domingo({ id: 1, fecha: '2026-11-08', meserosRequeridos: 2 });
    const conv = Convocatoria.crear(domingo, 'antiguedad', [meseros[1], meseros[2], meseros[0]]);

    assert.deepStrictEqual(conv.convocados().map((d) => d.mesero.meseroId), [2, 3]);
    assert.deepStrictEqual(conv.enDescanso().map((d) => d.mesero.meseroId), [1]);
});

test('Observer: el gestor reparte cada notificación a sus observadores', async () => {
    const gestor = new GestorNotificaciones();
    const recibidas = [];
    const observador = Object.assign(new Observador(), { actualizar: (n) => recibidas.push(n) });

    gestor.suscribir(observador);
    await gestor.notificarA([4, 5], 'turno', (id) => `hola ${id}`);

    assert.deepStrictEqual(recibidas.map((n) => [n.meseroId, n.mensaje]), [[4, 'hola 4'], [5, 'hola 5']]);
    assert.throws(() => gestor.suscribir({}), /Observador/);
    assert.throws(() => new Notificacion({ meseroId: 1, tipo: 'otro', mensaje: '' }), /inválido/);
});

test('Adapter: traduce DatosNequi a la API de Nequi y su respuesta al puerto', async () => {
    let enviado;
    const respuestaNequi = (codigo) => async (url, opciones) => {
        enviado = JSON.parse(opciones.body);
        return { json: async () => ({ ResponseMessage: {
            ResponseHeader: { Status: { StatusCode: codigo, StatusDesc: 'Saldo insuficiente' } },
            ResponseBody: { any: { unregisteredPaymentRS: { transactionId: 'T-1' } } }
        } }) };
    };
    const datos = new DatosNequi({ numeroCelular: '3001234567', monto: 10000, referencia: 'BON-1' });

    const ok = await new NequiAdapter({ urlApi: 'https://nequi.test', http: respuestaNequi('0') }).procesarPago(datos);
    assert.deepStrictEqual(ok, { exito: true, referencia: 'T-1' });
    assert.strictEqual(enviado.RequestMessage.RequestBody.any.unregisteredPaymentRQ.phoneNumber, '3001234567');

    const mal = await new NequiAdapter({ urlApi: 'https://nequi.test', http: respuestaNequi('10-455') }).procesarPago(datos);
    assert.deepStrictEqual(mal, { exito: false, mensaje: 'Saldo insuficiente' });

    const caido = await new NequiAdapter({ urlApi: 'https://nequi.test', http: async () => { throw new Error('ECONNREFUSED'); } })
        .procesarPago(datos);
    assert.strictEqual(caido.exito, false);
});
