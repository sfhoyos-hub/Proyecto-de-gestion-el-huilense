// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/ranking-rachas/racha.service');

async function consultar(req, res) {
    const racha = await service.consultarRacha(req.params.mesero_id, req.user);

    res.status(200).json(racha);
}

module.exports = { consultar };
