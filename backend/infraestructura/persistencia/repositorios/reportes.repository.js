// Solo SQL: consultas de lectura para reportes e historial.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

// Resumen por mesero entre dos fechas (incluidas) de domingos cerrados.
function resumenPorMesero(desde, hasta) {
    return getDB().all(
        `SELECT m.id AS mesero_id, m.nombre, m.apellido, m.estado,
                COUNT(r.id) AS domingos_trabajados,
                COALESCE(SUM(r.total_vendido), 0) AS total_vendido,
                COALESCE(SUM(r.top6), 0) AS veces_top6,
                MIN(r.posicion) AS mejor_posicion,
                COALESCE(SUM(b.monto), 0) AS total_bonificaciones,
                COALESCE(ra.racha_actual, 0) AS racha_actual
         FROM meseros m
         LEFT JOIN rankings r ON r.mesero_id = m.id AND r.domingo_id IN (
             SELECT id FROM domingos WHERE fecha BETWEEN ? AND ?)
         LEFT JOIN bonificaciones b ON b.ranking_id = r.id
         LEFT JOIN rachas ra ON ra.mesero_id = m.id
         GROUP BY m.id
         ORDER BY total_vendido DESC, m.id ASC`,
        [desde, hasta]
    );
}

function existeMesero(meseroId) {
    return getDB().get('SELECT id, nombre, apellido FROM meseros WHERE id = ?', [meseroId]);
}

// Historial de un mesero: un renglón por domingo en que vendió.
function historialDeMesero(meseroId) {
    return getDB().all(
        `SELECT d.fecha, v.total_vendido, d.cerrado,
                r.posicion, r.top6, b.monto AS bonificacion, b.estado AS estado_bonificacion
         FROM ventas v
         JOIN domingos d ON d.id = v.domingo_id
         LEFT JOIN rankings r ON r.domingo_id = v.domingo_id AND r.mesero_id = v.mesero_id
         LEFT JOIN bonificaciones b ON b.ranking_id = r.id
         WHERE v.mesero_id = ?
         ORDER BY d.fecha DESC`,
        [meseroId]
    );
}

module.exports = crearRepositorio({ resumenPorMesero, existeMesero, historialDeMesero });
