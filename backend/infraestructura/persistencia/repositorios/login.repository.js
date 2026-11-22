// Solo SQL.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

function buscarUsuarioPorCorreo(correo) {
    return getDB().get(
        `SELECT id, name, email, password, rol, estado
         FROM users WHERE email = ?`,
        [correo]
    );
}

function buscarUsuarioPorId(id) {
    return getDB().get(
        'SELECT id, name, email, rol, estado FROM users WHERE id = ?',
        [id]
    );
}

function buscarMeseroPorUsuario(usuarioId) {
    return getDB().get(
        'SELECT id, estado FROM meseros WHERE user_id = ?',
        [usuarioId]
    );
}

module.exports = crearRepositorio({
    buscarUsuarioPorCorreo,
    buscarUsuarioPorId,
    buscarMeseroPorUsuario
});
