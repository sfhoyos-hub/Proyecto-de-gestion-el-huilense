const jwt = require('jsonwebtoken');
const { puerto } = require('../../dominio/puertos/registro');

const repo = puerto('repositorio.login');
const { AppError } = require('../../utils/errores');
const { ESTADO_USUARIO } = require('../../utils/estados');

const ERRORES_TOKEN = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'];

// 1. Obtiene el token del encabezado Authorization: Bearer <token>.
function extraerToken(req) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new AppError(401, 'Debes iniciar sesión para acceder a este recurso');
    }

    return authorization.slice(7).trim();
}

// 2. Verifica la firma y la vigencia del token.
function verificarToken(token) {
    if (!process.env.JWT_SECRET) {
        console.error('Falta configurar JWT_SECRET');
        throw new AppError(500, 'La autenticación no está configurada');
    }

    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (ERRORES_TOKEN.includes(error.name)) {
            throw new AppError(401, 'Token inválido o expirado');
        }
        throw error;
    }
}

// 3. Busca al usuario dueño del token.
async function cargarUsuario(id) {
    const usuario = await repo.buscarUsuarioPorId(id);

    if (!usuario) {
        throw new AppError(401, 'La sesión ya no es válida');
    }

    return usuario;
}

// 4a. Un mesero solo entra si su usuario y su ficha están activos.
async function construirSesionMesero(usuario) {
    const mesero = await repo.buscarMeseroPorUsuario(usuario.id);

    if (!mesero || usuario.estado !== ESTADO_USUARIO.ACTIVO ||
        mesero.estado !== ESTADO_USUARIO.ACTIVO) {
        throw new AppError(403, 'La cuenta se encuentra inactiva');
    }

    return { ...usuario, mesero_id: mesero.id, estado_mesero: mesero.estado };
}

// 4b. Los demás roles deben tener el usuario activo.
function construirSesionGeneral(usuario) {
    if (usuario.estado !== ESTADO_USUARIO.ACTIVO) {
        throw new AppError(403, 'La cuenta no está activa');
    }

    return usuario;
}

function validarEstadoActivo(usuario) {
    return usuario.rol === 'MESERO'
        ? construirSesionMesero(usuario)
        : construirSesionGeneral(usuario);
}

// requireAuth solo orquesta los pasos anteriores.
async function requireAuth(req, res, next) {
    try {
        const payload = verificarToken(extraerToken(req));
        const usuario = await cargarUsuario(payload.sub);

        req.user = await validarEstadoActivo(usuario);
        return next();
    } catch (error) {
        return next(error);
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.rol)) {
            return next(new AppError(403,
                'No tienes permisos para realizar esta operación'));
        }

        return next();
    };
}

module.exports = { requireAuth, requireRole };
