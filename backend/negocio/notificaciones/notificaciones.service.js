// Consulta de la bandeja de notificaciones del mesero. Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const { AppError } = require('../../utils/errores');
const { esIdValido } = require('../../utils/validaciones');

const repo = puerto('repositorio.notificaciones');

function listarMias(usuario) {
    return repo.listarPorMesero(usuario.mesero_id);
}

async function marcarLeida(idParam, usuario) {
    if (!esIdValido(idParam)) {
        throw new AppError(400, 'El ID de la notificación no es válido.');
    }

    const resultado = await repo.marcarLeida(Number(idParam), usuario.mesero_id);

    // Si no es suya, se responde igual que si no existiera.
    if (resultado.changes === 0) {
        throw new AppError(404, 'Notificación no encontrada.');
    }
}

module.exports = { listarMias, marcarLeida };
