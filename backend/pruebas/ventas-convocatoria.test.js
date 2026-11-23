// Pruebas de la regla RF-10: solo los meseros convocados a un domingo pueden
// tener ventas ese domingo. Usa repositorios falsos (sin base de datos).
const test = require('node:test');
const assert = require('node:assert');

const { registrar, implementar } = require('../dominio/puertos/registro');
const IRepositorio = require('../dominio/puertos/IRepositorio');
const IAuditoria = require('../dominio/puertos/IAuditoria');

// Domingo 1: convocatoria con los meseros 1 y 2 (el 3 descansa).
// Domingo 2: registrado antes de la convocatoria automática (sin convocatoria).
const CONVOCATORIAS = { 1: { convocados: [1, 2], descanso: [3] }, 2: null };
const DOMINGOS = { '2026-12-06': { id: 1, fecha: '2026-12-06', cerrado: 0 }, '2026-11-29': { id: 2, fecha: '2026-11-29', cerrado: 0 } };
const insertadas = [];

registrar('repositorio.ventas', implementar(IRepositorio, {
    enTransaccion: (fn) => fn(),
    buscarMeseroPorId: async (id) => ({ id, estado: 'ACTIVO' }),
    estadoConvocatoria: async (meseroId, domingoId) => {
        const conv = CONVOCATORIAS[domingoId];
        if (!conv) return { total: 0, convocado: 0 };
        return {
            total: conv.convocados.length + conv.descanso.length,
            convocado: conv.convocados.includes(meseroId) ? 1 : 0
        };
    },
    buscarVentaDuplicada: async () => undefined,
    insertar: async (meseroId, domingoId, monto) => {
        insertadas.push({ meseroId, domingoId, monto });
        return { lastID: insertadas.length };
    },
    buscarResumenPorId: async (id) => ({ id })
}), IRepositorio);

registrar('repositorio.domingos', implementar(IRepositorio, {
    enTransaccion: (fn) => fn(),
    buscarPorFecha: async (fecha) => DOMINGOS[fecha]
}), IRepositorio);

registrar('auditoria', implementar(IAuditoria, {
    registrarAccesoDenegado: async () => {},
    registrarCambioMonto: async () => {},
    registrarCambioCuenta: async () => {}
}), IAuditoria);

const ventas = require('../negocio/ventas-corte/ventas.service');
const ADMIN = { id: 1, rol: 'ADMIN' };

test('se registra la venta de un mesero convocado', async () => {
    await ventas.registrarVenta({ mesero_id: 1, fecha: '2026-12-06', total_vendido: 50000 }, ADMIN);
    assert.deepStrictEqual(insertadas.at(-1), { meseroId: 1, domingoId: 1, monto: 50000 });
});

test('se rechaza la venta de un mesero que está en descanso', async () => {
    await assert.rejects(
        ventas.registrarVenta({ mesero_id: 3, fecha: '2026-12-06', total_vendido: 50000 }, ADMIN),
        (error) => error.status === 409 && /no está convocado/.test(error.message)
    );
});

test('un domingo sin convocatoria acepta a cualquier mesero activo', async () => {
    await ventas.registrarVenta({ mesero_id: 3, fecha: '2026-11-29', total_vendido: 1000 }, ADMIN);
    assert.deepStrictEqual(insertadas.at(-1), { meseroId: 3, domingoId: 2, monto: 1000 });
});
