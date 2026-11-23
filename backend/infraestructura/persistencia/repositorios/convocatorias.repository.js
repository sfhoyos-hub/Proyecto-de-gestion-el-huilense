// Solo SQL.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

function buscarDomingo(domingoId) {
    return getDB().get(
        'SELECT id, fecha, temporada_id, meseros_requeridos, cerrado FROM domingos WHERE id = ?',
        [domingoId]
    );
}

// Meseros activos con lo que necesitan las estrategias: antigüedad y lo
// vendido en los últimos domingos cerrados antes de la fecha indicada.
function listarMeserosActivosConRendimiento(fecha, domingosRecientes) {
    return getDB().all(
        `SELECT m.id, m.user_id, m.identificacion, m.nombre, m.apellido,
                m.fecha_ingreso, m.estado,
                COALESCE(SUM(v.total_vendido), 0) AS total_reciente
         FROM meseros m
         LEFT JOIN ventas v ON v.mesero_id = m.id AND v.domingo_id IN (
             SELECT id FROM domingos
             WHERE cerrado = 1 AND fecha < ?
             ORDER BY fecha DESC LIMIT ?)
         WHERE m.estado = 'ACTIVO'
         GROUP BY m.id`,
        [fecha, domingosRecientes]
    );
}

function contarVentasDelDomingo(domingoId) {
    return getDB().get(
        'SELECT COUNT(*) AS total FROM ventas WHERE domingo_id = ?',
        [domingoId]
    );
}

function eliminarDelDomingo(domingoId) {
    return getDB().run('DELETE FROM convocatorias WHERE domingo_id = ?', [domingoId]);
}

function insertar(domingoId, meseroId, estado) {
    return getDB().run(
        'INSERT INTO convocatorias (domingo_id, mesero_id, estado) VALUES (?, ?, ?)',
        [domingoId, meseroId, estado]
    );
}

function listarPorDomingo(domingoId) {
    return getDB().all(
        `SELECT c.id, c.mesero_id, c.estado, m.nombre, m.apellido, m.identificacion
         FROM convocatorias c
         JOIN meseros m ON m.id = c.mesero_id
         WHERE c.domingo_id = ?
         ORDER BY c.estado ASC, c.id ASC`,
        [domingoId]
    );
}

function listarPorMesero(meseroId) {
    return getDB().all(
        `SELECT c.id, d.id AS domingo_id, d.fecha, c.estado
         FROM convocatorias c
         JOIN domingos d ON d.id = c.domingo_id
         WHERE c.mesero_id = ?
         ORDER BY d.fecha DESC`,
        [meseroId]
    );
}

module.exports = crearRepositorio({
    buscarDomingo,
    listarMeserosActivosConRendimiento,
    contarVentasDelDomingo,
    eliminarDelDomingo,
    insertar,
    listarPorDomingo,
    listarPorMesero
});
