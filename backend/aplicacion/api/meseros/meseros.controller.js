// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/meseros/meseros.service');

async function registrar(req, res) {
    const resultado = await service.registrar(req.body, req.user);

    res.status(201).json({
        mensaje: 'Mesero registrado correctamente',
        ...resultado
    });
}

async function listar(req, res) {
    res.status(200).json(await service.listar());
}

async function obtenerPorId(req, res) {
    const mesero = await service.obtenerPorId(req.params.id, req.user);

    res.status(200).json(mesero);
}

async function actualizar(req, res) {
    await service.actualizar(req.params.id, req.body, req.user);

    res.status(200).json({ mensaje: 'Mesero actualizado correctamente' });
}

async function cambiarEstado(req, res) {
    const resultado = await service.cambiarEstado(
        req.params.id, req.body, req.user
    );

    res.status(200).json({
        mensaje: 'Estado del mesero actualizado correctamente',
        ...resultado
    });
}

async function desactivar(req, res) {
    await service.desactivar(req.params.id, req.user);

    res.status(200).json({
        mensaje: 'Mesero desactivado correctamente; su historial se conserva'
    });
}

module.exports = {
    registrar,
    listar,
    obtenerPorId,
    actualizar,
    cambiarEstado,
    desactivar
};
