// Solo lee req, llama al service y responde res.
const service = require('../../../negocio/sugerencias/sugerencias.service');

async function crear(req, res) {
    await service.crear(req.body);

    // No se devuelve la sugerencia: el formulario es anónimo y público.
    res.status(201).json({ mensaje: '¡Gracias! Recibimos tu sugerencia.' });
}

async function listar(req, res) {
    res.status(200).json(await service.listar());
}

module.exports = { crear, listar };
