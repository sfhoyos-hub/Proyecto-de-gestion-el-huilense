// Solo SQL.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

// SELECT compartido por la consulta por fecha y la consulta por id.
function consultaBase(columnasExtra = '') {
    return `SELECT b.id, b.ranking_id, b.monto, b.fecha_entrega,
                   b.observaciones, b.estado, r.posicion, r.total_vendido,
                   m.id AS mesero_id, m.nombre, m.apellido,
                   m.identificacion ${columnasExtra}
            FROM bonificaciones b
            JOIN rankings r ON r.id = b.ranking_id
            JOIN domingos d ON d.id = r.domingo_id
            JOIN meseros m ON m.id = r.mesero_id`;
}

function listarPorFecha(fecha) {
    return getDB().all(
        `${consultaBase()} WHERE d.fecha = ? ORDER BY r.posicion ASC`,
        [fecha]
    );
}

function buscarPorId(id) {
    return getDB().get(
        `${consultaBase(', d.fecha AS fecha_domingo')} WHERE b.id = ?`,
        [id]
    );
}

// Una sola consulta: el LEFT JOIN indica qué posiciones ya tienen
// bonificación (evita consultar dentro de un bucle).
function obtenerTop6ConBonificacion(domingoId) {
    return getDB().all(
        `SELECT r.id AS ranking_id, r.posicion, r.mesero_id,
                r.total_vendido, b.id AS bonificacion_id
         FROM rankings r
         LEFT JOIN bonificaciones b ON b.ranking_id = r.id
         WHERE r.domingo_id = ? AND r.top6 = 1
         ORDER BY r.posicion ASC`,
        [domingoId]
    );
}

function insertar({ rankingId, monto, fechaEntrega, observaciones, estado }) {
    return getDB().run(
        `INSERT INTO bonificaciones
            (ranking_id, monto, fecha_entrega, observaciones, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [rankingId, monto, fechaEntrega, observaciones, estado]
    );
}

module.exports = crearRepositorio({
    listarPorFecha,
    buscarPorId,
    obtenerTop6ConBonificacion,
    insertar
});
