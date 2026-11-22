// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/bonificaciones/bonificaciones.service');

async function consultar(req, res) {
    const { fecha } = req.query;
    const bonificaciones = await service.consultarPorFecha(fecha);

    res.status(200).json({
        fecha,
        cantidad_beneficiarios: bonificaciones.length,
        total_bonificaciones: service.calcularTotal(bonificaciones),
        bonificaciones
    });
}

async function generar(req, res) {
    const { fecha } = req.body;
    const generadas = await service.generar(req.body, req.user);

    res.status(201).json({
        mensaje: 'Bonificaciones generadas correctamente.',
        fecha,
        cantidad_beneficiarios: generadas.length,
        total_bonificaciones: service.calcularTotal(generadas),
        bonificaciones: generadas
    });
}

async function obtenerPorId(req, res) {
    res.status(200).json(await service.obtenerPorId(req.params.id));
}

module.exports = { consultar, generar, obtenerPorId };
