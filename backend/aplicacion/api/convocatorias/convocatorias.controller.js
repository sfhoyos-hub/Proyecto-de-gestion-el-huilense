// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/convocatoria/convocatoria.service');

async function generar(req, res) {
    const convocatoria = await service.generar(req.body);

    res.status(201).json({ mensaje: 'Convocatoria generada correctamente.', convocatoria });
}

async function consultar(req, res) {
    res.status(200).json(await service.consultar(req.params.domingo_id));
}

async function mias(req, res) {
    res.status(200).json(await service.misConvocatorias(req.user));
}

module.exports = { generar, consultar, mias };
