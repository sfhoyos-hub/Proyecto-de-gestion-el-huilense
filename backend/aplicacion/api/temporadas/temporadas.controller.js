// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/ventas-corte/temporadas.service');

async function listar(req, res) {
    res.status(200).json(await service.listar());
}

async function crear(req, res) {
    const temporada = await service.crear(req.body);

    res.status(201).json({ mensaje: 'Temporada registrada correctamente.', temporada });
}

module.exports = { listar, crear };
