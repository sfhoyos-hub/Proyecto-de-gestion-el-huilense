// Solo SQL.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

function insertar(notificacion) {
    return getDB().run(
        `INSERT INTO notificaciones (mesero_id, tipo, mensaje, fecha, leida)
         VALUES (?, ?, ?, ?, 0)`,
        [notificacion.meseroId, notificacion.tipo, notificacion.mensaje, notificacion.fecha]
    );
}

function listarPorMesero(meseroId) {
    return getDB().all(
        `SELECT id, tipo, mensaje, fecha, leida FROM notificaciones
         WHERE mesero_id = ? ORDER BY fecha DESC, id DESC`,
        [meseroId]
    );
}

function marcarLeida(id, meseroId) {
    return getDB().run(
        'UPDATE notificaciones SET leida = 1 WHERE id = ? AND mesero_id = ?',
        [id, meseroId]
    );
}

module.exports = crearRepositorio({ insertar, listarPorMesero, marcarLeida });
