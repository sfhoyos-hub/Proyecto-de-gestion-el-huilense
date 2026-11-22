// Solo SQL. buscarPorFecha también lo usan ventas, ranking y bonificaciones.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

function insertar(fecha, temporadaId, cantidad) {
    return getDB().run(
        `INSERT INTO domingos (fecha, temporada_id, meseros_requeridos)
         VALUES (?, ?, ?)`,
        [fecha, temporadaId, cantidad]
    );
}

function listar() {
    return getDB().all(`
        SELECT d.id, d.fecha, d.temporada_id, t.nombre AS temporada,
               d.meseros_requeridos, d.cerrado, d.fecha_cierre
        FROM domingos d
        LEFT JOIN temporadas t ON t.id = d.temporada_id
        ORDER BY d.fecha DESC
    `);
}

function buscarPorId(id) {
    return getDB().get('SELECT * FROM domingos WHERE id = ?', [id]);
}

function buscarPorFecha(fecha) {
    return getDB().get(
        'SELECT id, fecha, cerrado FROM domingos WHERE fecha = ?',
        [fecha]
    );
}

function buscarEstadoDeCierre(id) {
    return getDB().get('SELECT cerrado FROM domingos WHERE id = ?', [id]);
}

function existeTemporada(id) {
    return getDB().get('SELECT id FROM temporadas WHERE id = ?', [id]);
}

function marcarCerrado(id, fechaCierre) {
    return getDB().run(
        'UPDATE domingos SET cerrado = 1, fecha_cierre = ? WHERE id = ?',
        [fechaCierre, id]
    );
}

module.exports = crearRepositorio({
    insertar,
    listar,
    buscarPorId,
    buscarPorFecha,
    buscarEstadoDeCierre,
    existeTemporada,
    marcarCerrado
});
