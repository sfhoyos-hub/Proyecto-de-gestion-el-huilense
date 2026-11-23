// Solo SQL: cuentas Nequi, solicitudes de pago y estado de la bonificación.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

function buscarCuenta(meseroId) {
    return getDB().get(
        'SELECT id, mesero_id, numero_celular FROM cuentas_nequi WHERE mesero_id = ?',
        [meseroId]
    );
}

function guardarCuenta(meseroId, numeroCelular) {
    return getDB().run(
        `INSERT INTO cuentas_nequi (mesero_id, numero_celular) VALUES (?, ?)
         ON CONFLICT (mesero_id) DO UPDATE SET numero_celular = excluded.numero_celular`,
        [meseroId, numeroCelular]
    );
}

function existeMesero(meseroId) {
    return getDB().get('SELECT id FROM meseros WHERE id = ?', [meseroId]);
}

function buscarBonificacion(id) {
    return getDB().get(
        `SELECT b.id, b.ranking_id, b.monto, b.estado, r.mesero_id
         FROM bonificaciones b
         JOIN rankings r ON r.id = b.ranking_id
         WHERE b.id = ?`,
        [id]
    );
}

function marcarBonificacionPagada(id) {
    return getDB().run(
        "UPDATE bonificaciones SET estado = 'PAGADA' WHERE id = ?",
        [id]
    );
}

function buscarSolicitud(bonificacionId) {
    return getDB().get(
        `SELECT id, bonificacion_id, estado, fecha_solicitud, fecha_confirmacion, mensaje_error
         FROM solicitudes_pago WHERE bonificacion_id = ?`,
        [bonificacionId]
    );
}

// Una solicitud por bonificación: un reintento reutiliza la fila existente.
function guardarSolicitud(solicitud) {
    return getDB().run(
        `INSERT INTO solicitudes_pago
            (bonificacion_id, estado, fecha_solicitud, fecha_confirmacion, mensaje_error)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (bonificacion_id) DO UPDATE SET
            estado = excluded.estado,
            fecha_solicitud = excluded.fecha_solicitud,
            fecha_confirmacion = excluded.fecha_confirmacion,
            mensaje_error = excluded.mensaje_error`,
        [solicitud.bonificacionId, solicitud.estado, solicitud.fechaSolicitud,
            solicitud.fechaConfirmacion, solicitud.mensajeError]
    );
}

function listarSolicitudes() {
    return getDB().all(
        `SELECT s.id, s.bonificacion_id, s.estado, s.fecha_solicitud,
                s.fecha_confirmacion, s.mensaje_error, b.monto,
                m.id AS mesero_id, m.nombre, m.apellido, d.fecha AS fecha_domingo
         FROM solicitudes_pago s
         JOIN bonificaciones b ON b.id = s.bonificacion_id
         JOIN rankings r ON r.id = b.ranking_id
         JOIN meseros m ON m.id = r.mesero_id
         JOIN domingos d ON d.id = r.domingo_id
         ORDER BY s.fecha_solicitud DESC`
    );
}

module.exports = crearRepositorio({
    buscarCuenta,
    guardarCuenta,
    existeMesero,
    buscarBonificacion,
    marcarBonificacionPagada,
    buscarSolicitud,
    guardarSolicitud,
    listarSolicitudes
});
