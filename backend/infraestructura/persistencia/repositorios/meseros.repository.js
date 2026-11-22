// Solo SQL. No contiene reglas de negocio.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');
const { ESTADO_USUARIO } = require('../../../utils/estados');

const COLUMNAS_MESERO = `
    m.id, m.user_id, m.identificacion, m.nombre,
    m.apellido, m.fecha_ingreso, m.estado, u.name, u.email`;

function buscarUsuarioPorCorreo(correo, excluirUserId = 0) {
    return getDB().get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [correo, excluirUserId]
    );
}

function buscarPorIdentificacion(identificacion, excluirId = 0) {
    return getDB().get(
        'SELECT id FROM meseros WHERE identificacion = ? AND id != ?',
        [identificacion, excluirId]
    );
}

function insertarUsuario({ name, correo, passwordHash }) {
    return getDB().run(
        `INSERT INTO users (name, email, password, rol, estado)
         VALUES (?, ?, ?, 'MESERO', ?)`,
        [name, correo, passwordHash, ESTADO_USUARIO.ACTIVO]
    );
}

function insertarMesero(datos) {
    return getDB().run(
        `INSERT INTO meseros
         (user_id, identificacion, nombre, apellido, fecha_ingreso, estado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [datos.userId, datos.identificacion, datos.nombre,
            datos.apellido, datos.fecha_ingreso, ESTADO_USUARIO.ACTIVO]
    );
}

function listar() {
    return getDB().all(`
        SELECT ${COLUMNAS_MESERO}
        FROM meseros m
        INNER JOIN users u ON m.user_id = u.id
        ORDER BY m.id ASC
    `);
}

function buscarConUsuario(id) {
    return getDB().get(`
        SELECT ${COLUMNAS_MESERO}, u.rol
        FROM meseros m
        INNER JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
    `, [id]);
}

function buscarBasico(id) {
    return getDB().get(
        `SELECT m.id, m.user_id, m.estado, u.email
         FROM meseros m
         LEFT JOIN users u ON u.id = m.user_id
         WHERE m.id = ?`,
        [id]
    );
}

// Un solo UPDATE: la contraseña solo se incluye si viene un hash nuevo.
function actualizarUsuario(userId, { name, correo, estado, passwordHash }) {
    const campos = ['name = ?', 'email = ?', 'estado = ?'];
    const valores = [name, correo, estado];

    if (passwordHash) {
        campos.push('password = ?');
        valores.push(passwordHash);
    }

    return getDB().run(
        `UPDATE users SET ${campos.join(', ')} WHERE id = ?`,
        [...valores, userId]
    );
}

function actualizarMesero(id, datos) {
    return getDB().run(
        `UPDATE meseros
         SET identificacion = ?, nombre = ?, apellido = ?,
             fecha_ingreso = ?, estado = ?
         WHERE id = ?`,
        [datos.identificacion, datos.nombre, datos.apellido,
            datos.fecha_ingreso, datos.estado, id]
    );
}

function actualizarEstadoMesero(id, estado) {
    return getDB().run(
        'UPDATE meseros SET estado = ? WHERE id = ?',
        [estado, id]
    );
}

function actualizarEstadoUsuario(userId, estado) {
    return getDB().run(
        'UPDATE users SET estado = ? WHERE id = ?',
        [estado, userId]
    );
}

module.exports = crearRepositorio({
    buscarUsuarioPorCorreo,
    buscarPorIdentificacion,
    insertarUsuario,
    insertarMesero,
    listar,
    buscarConUsuario,
    buscarBasico,
    actualizarUsuario,
    actualizarMesero,
    actualizarEstadoMesero,
    actualizarEstadoUsuario
});
