// Solo SQL.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

const RESUMEN_VENTA = `
    SELECT v.id, v.mesero_id, d.fecha, v.total_vendido
    FROM ventas v
    JOIN domingos d ON d.id = v.domingo_id`;

function buscarMeseroPorId(id) {
    return getDB().get('SELECT id, estado FROM meseros WHERE id = ?', [id]);
}

function buscarVentaConDomingo(id) {
    return getDB().get(
        `SELECT v.id, v.mesero_id, v.domingo_id, v.total_vendido, d.cerrado
         FROM ventas v
         JOIN domingos d ON d.id = v.domingo_id
         WHERE v.id = ?`,
        [id]
    );
}

// excluirId = 0 no excluye ninguna venta (los ids empiezan en 1).
function buscarVentaDuplicada(meseroId, domingoId, excluirId = 0) {
    return getDB().get(
        `SELECT id FROM ventas
         WHERE mesero_id = ? AND domingo_id = ? AND id != ?`,
        [meseroId, domingoId, excluirId]
    );
}

function insertar(meseroId, domingoId, monto) {
    return getDB().run(
        `INSERT INTO ventas (mesero_id, domingo_id, total_vendido)
         VALUES (?, ?, ?)`,
        [meseroId, domingoId, monto]
    );
}

function actualizar(id, meseroId, domingoId, monto) {
    return getDB().run(
        `UPDATE ventas
         SET mesero_id = ?, domingo_id = ?, total_vendido = ?
         WHERE id = ?`,
        [meseroId, domingoId, monto, id]
    );
}

function buscarResumenPorId(id) {
    return getDB().get(`${RESUMEN_VENTA} WHERE v.id = ?`, [id]);
}

function listar(fecha) {
    const filtro = fecha === undefined ? '' : 'WHERE d.fecha = ?';
    const parametros = fecha === undefined ? [] : [fecha];

    return getDB().all(
        `SELECT v.id, v.mesero_id, d.fecha, v.total_vendido,
                m.nombre, m.apellido, m.identificacion
         FROM ventas v
         JOIN domingos d ON d.id = v.domingo_id
         JOIN meseros m ON m.id = v.mesero_id
         ${filtro}
         ORDER BY d.fecha DESC, v.total_vendido DESC`,
        parametros
    );
}

function listarPorMesero(meseroId) {
    return getDB().all(
        `${RESUMEN_VENTA} WHERE v.mesero_id = ? ORDER BY d.fecha DESC`,
        [meseroId]
    );
}

module.exports = crearRepositorio({
    buscarMeseroPorId,
    buscarVentaConDomingo,
    buscarVentaDuplicada,
    insertar,
    actualizar,
    buscarResumenPorId,
    listar,
    listarPorMesero
});
