// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/reportes/reportes.service');

async function resumen(req, res) {
    res.status(200).json(await service.resumen(req.query));
}

async function historial(req, res) {
    res.status(200).json(await service.historial(req.params.mesero_id, req.user));
}

module.exports = { resumen, historial };
