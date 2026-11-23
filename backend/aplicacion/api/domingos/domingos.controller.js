// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/ventas-corte/domingos.service');

async function registrar(req, res) {
    const { domingo, convocatoria, aviso } = await service.registrar(req.body);

    res.status(201).json({
        mensaje: convocatoria
            ? 'Domingo registrado y meseros convocados automáticamente.'
            : 'Domingo registrado correctamente.',
        domingo,
        convocatoria,
        aviso
    });
}

async function listar(req, res) {
    res.status(200).json(await service.listar());
}

async function obtenerPorId(req, res) {
    res.status(200).json(await service.obtenerPorId(req.params.id));
}

async function cerrarCorte(req, res) {
    const top6 = await service.cerrarCorte(req.params.id);

    res.status(200).json({
        mensaje: 'Corte dominical cerrado, ranking calculado y rachas actualizadas exitosamente.',
        top6
    });
}

module.exports = { registrar, listar, obtenerPorId, cerrarCorte };
