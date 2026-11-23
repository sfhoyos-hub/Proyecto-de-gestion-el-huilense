// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/pagos/pagos.service');

const MSG_CUENTA = 'Cuenta Nequi guardada correctamente.';

async function miCuenta(req, res) {
    res.status(200).json(await service.obtenerCuenta(req.user.mesero_id));
}

async function guardarMiCuenta(req, res) {
    const cuenta = await service.guardarCuenta(req.user.mesero_id, req.body, req.user);

    res.status(200).json({ mensaje: MSG_CUENTA, cuenta });
}

async function cuentaDeMesero(req, res) {
    res.status(200).json(await service.obtenerCuenta(req.params.mesero_id));
}

async function guardarCuentaDeMesero(req, res) {
    const cuenta = await service.guardarCuenta(req.params.mesero_id, req.body, req.user);

    res.status(200).json({ mensaje: MSG_CUENTA, cuenta });
}

async function pagarBonificacion(req, res) {
    const pago = await service.pagarBonificacion(req.params.id, req.user);

    res.status(200).json({ mensaje: 'Pago enviado por Nequi correctamente.', pago });
}

async function listar(req, res) {
    res.status(200).json(await service.listarSolicitudes());
}

module.exports = {
    miCuenta,
    guardarMiCuenta,
    cuentaDeMesero,
    guardarCuentaDeMesero,
    pagarBonificacion,
    listar
};
