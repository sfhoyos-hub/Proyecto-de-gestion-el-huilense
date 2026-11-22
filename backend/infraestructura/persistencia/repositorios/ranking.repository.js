// Solo SQL.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

// Una sola consulta para el ranking completo y para el Top 6.
function obtenerRanking(fecha, soloTop6) {
    const filtroTop6 = soloTop6 ? 'AND r.top6 = 1' : '';

    return getDB().all(
        `SELECT r.id, r.posicion, m.id AS mesero_id, m.nombre, m.apellido,
                m.identificacion, r.total_vendido, r.top6
         FROM rankings r
         JOIN domingos d ON d.id = r.domingo_id
         JOIN meseros m ON m.id = r.mesero_id
         WHERE d.fecha = ? ${filtroTop6}
         ORDER BY r.posicion ASC`,
        [fecha]
    );
}

function obtenerVentasOrdenadas(domingoId) {
    return getDB().all(
        `SELECT mesero_id, total_vendido
         FROM ventas
         WHERE domingo_id = ?
         ORDER BY total_vendido DESC`,
        [domingoId]
    );
}

function insertar(domingoId, fila) {
    return getDB().run(
        `INSERT INTO rankings
            (domingo_id, mesero_id, posicion, total_vendido, top6)
         VALUES (?, ?, ?, ?, ?)`,
        [domingoId, fila.mesero_id, fila.posicion,
            fila.total_vendido, fila.top6]
    );
}

function buscarPuesto(domingoId, meseroId) {
    return getDB().get(
        `SELECT r.posicion, r.top6, r.total_vendido, m.id AS mesero_id
         FROM rankings r
         INNER JOIN meseros m ON m.id = r.mesero_id
         WHERE r.domingo_id = ? AND m.id = ?`,
        [domingoId, meseroId]
    );
}

module.exports = crearRepositorio({
    obtenerRanking,
    obtenerVentasOrdenadas,
    insertar,
    buscarPuesto
});
