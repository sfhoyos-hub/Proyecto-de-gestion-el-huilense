const { AppError } = require('../../utils/errores');

function esErrorDeRestriccion(error) {
    return typeof error.code === 'string' &&
        error.code.startsWith('SQLITE_CONSTRAINT');
}

function responder(res, status, mensaje) {
    return res.status(status).json({ mensaje });
}

// Único punto donde se convierten los errores en respuestas HTTP.
// Nunca se envía error.message de errores inesperados al cliente.
// Debe registrarse DESPUÉS de todas las rutas (4 parámetros obligatorios).
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
    if (error instanceof AppError) {
        return responder(res, error.status, error.message);
    }

    if (error.type === 'entity.parse.failed') {
        return responder(res, 400, 'El cuerpo de la petición no es un JSON válido');
    }

    console.error('Error no controlado:', error);

    if (esErrorDeRestriccion(error)) {
        return responder(res, 409,
            'El registro ya existe o incumple una restricción de datos');
    }

    return responder(res, 500, 'Error interno del servidor');
}

module.exports = errorHandler;
