// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/notificaciones/notificaciones.service');

async function listar(req, res) {
    res.status(200).json(await service.listarMias(req.user));
}

async function marcarLeida(req, res) {
    await service.marcarLeida(req.params.id, req.user);

    res.status(200).json({ mensaje: 'Notificación marcada como leída.' });
}

module.exports = { listar, marcarLeida };
