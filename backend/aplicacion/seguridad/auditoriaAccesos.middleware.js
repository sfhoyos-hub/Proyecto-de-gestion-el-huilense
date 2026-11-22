// Deja en la auditoría cada acceso denegado (401 y 403), sin importar si
// lo rechazó el middleware de autenticación, requireRole o un service.
// Se registra ANTES de errorHandler y nunca altera la respuesta: si la
// auditoría falla, el cliente recibe igualmente su 401/403.
const { AppError } = require('../../utils/errores');
const { puerto } = require('../../dominio/puertos/registro');

const auditoria = puerto('auditoria');

const ESTADOS_DE_ACCESO_DENEGADO = [401, 403];

function esAccesoDenegado(error) {
    return error instanceof AppError &&
        ESTADOS_DE_ACCESO_DENEGADO.includes(error.status);
}

// La ruta se guarda sin query string (puede traer datos que no deben quedar).
function construirEvento(req, error) {
    return {
        usuarioId: req.user?.id,
        rol: req.user?.rol,
        metodo: req.method,
        ruta: req.originalUrl.split('?')[0],
        ip: req.ip,
        motivo: error.message,
        estadoHttp: error.status
    };
}

async function registrarAcceso(req, error) {
    try {
        await auditoria.registrarAccesoDenegado(construirEvento(req, error));
    } catch (errorAuditoria) {
        console.error('No se pudo auditar el acceso denegado:', errorAuditoria);
    }
}

// eslint-disable-next-line no-unused-vars
async function auditarAccesosDenegados(error, req, res, next) {
    if (esAccesoDenegado(error)) {
        await registrarAcceso(req, error);
    }

    next(error);
}

module.exports = auditarAccesosDenegados;
