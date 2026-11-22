// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/ranking-rachas/ranking.service');

async function consultar(req, res) {
    const { fecha } = req.query;
    const ranking = await service.consultarRanking(fecha);

    res.status(200).json({ fecha, cantidad: ranking.length, ranking });
}

async function consultarTop6(req, res) {
    const { fecha } = req.query;
    const top6 = await service.consultarTop6(fecha);

    res.status(200).json({ fecha, cantidad: top6.length, top6 });
}

async function miPuesto(req, res) {
    const puesto = await service.consultarMiPuesto(req.query.fecha, req.user);

    res.json(puesto);
}

module.exports = { consultar, consultarTop6, miPuesto };
