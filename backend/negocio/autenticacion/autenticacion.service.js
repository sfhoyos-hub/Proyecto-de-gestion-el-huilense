// Reglas de autenticación. Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const jwt = require('jsonwebtoken');
const repo = puerto('repositorio.login');
const { AppError } = require('../../utils/errores');
const { ESTADO_USUARIO } = require('../../utils/estados');
const { verificarPassword } = require('../../utils/passwords');

const MSG_CREDENCIALES = 'Correo o contraseña incorrectos';

function validarCredenciales(body) {
    const { email, password } = body || {};

    if (typeof email !== 'string' || typeof password !== 'string' ||
        !email.trim() || !password) {
        throw new AppError(400,
            'Correo electrónico y contraseña son obligatorios');
    }

    return { correo: email.trim().toLowerCase(), password };
}

function validarConfiguracion() {
    if (!process.env.JWT_SECRET) {
        console.error('Falta configurar JWT_SECRET en el archivo .env');
        throw new AppError(500, 'La autenticación no está configurada');
    }
}

// Mensaje genérico para no revelar si un correo existe.
async function buscarUsuario(correo) {
    const usuario = await repo.buscarUsuarioPorCorreo(correo);

    if (!usuario) {
        throw new AppError(401, MSG_CREDENCIALES);
    }

    return usuario;
}

function validarCuentaActiva(usuario) {
    if (usuario.estado !== ESTADO_USUARIO.ACTIVO) {
        throw new AppError(403, 'La cuenta se encuentra inactiva');
    }
}

async function obtenerMeseroDeUsuario(usuario) {
    if (usuario.rol !== 'MESERO') {
        return null;
    }

    const mesero = await repo.buscarMeseroPorUsuario(usuario.id);

    if (!mesero || mesero.estado !== ESTADO_USUARIO.ACTIVO) {
        throw new AppError(403, 'La cuenta se encuentra inactiva');
    }

    return mesero;
}

function generarToken(usuario) {
    return jwt.sign(
        { sub: String(usuario.id) },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );
}

function armarUsuarioDeRespuesta(usuario, mesero) {
    const { id, name, email, rol, estado } = usuario;
    const datosMesero = mesero
        ? { mesero_id: mesero.id, estado_mesero: mesero.estado }
        : {};

    return { id, name, email, rol, estado, ...datosMesero };
}

// La contraseña solo se compara contra un hash bcrypt, nunca en texto plano.
async function verificarCredenciales(usuario, password) {
    if (!await verificarPassword(password, usuario.password)) {
        throw new AppError(401, MSG_CREDENCIALES);
    }
}

async function iniciarSesion(body) {
    const { correo, password } = validarCredenciales(body);

    validarConfiguracion();

    const usuario = await buscarUsuario(correo);

    await verificarCredenciales(usuario, password);
    validarCuentaActiva(usuario);

    const mesero = await obtenerMeseroDeUsuario(usuario);

    return {
        token: generarToken(usuario),
        usuario: armarUsuarioDeRespuesta(usuario, mesero)
    };
}

module.exports = { iniciarSesion };
