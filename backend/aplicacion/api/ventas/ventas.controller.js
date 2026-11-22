// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/ventas-corte/ventas.service');

async function registrar(req, res) {
    const venta = await service.registrarVenta(req.body, req.user);

    res.status(201).json({
        mensaje: 'Venta registrada correctamente.',
        venta
    });
}

async function editar(req, res) {
    const venta = await service.editarVenta(
        req.params.id, req.body, req.user
    );

    res.status(200).json({
        mensaje: 'Venta actualizada correctamente.',
        venta
    });
}

async function listar(req, res) {
    res.status(200).json(await service.listarVentas(req.query.fecha));
}

async function historialDeMesero(req, res) {
    const ventas = await service.historialDeMesero(
        req.params.mesero_id,
        req.user
    );

    res.status(200).json(ventas);
}

module.exports = { registrar, editar, listar, historialDeMesero };
