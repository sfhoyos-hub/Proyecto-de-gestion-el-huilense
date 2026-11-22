// Solo lee req, llama al service y responde res.
const autenticacion = require('../../../negocio/autenticacion/autenticacion.service');

async function iniciarSesion(req, res) {
    const { token, usuario } = await autenticacion.iniciarSesion(req.body);

    res.status(200).json({ mensaje: 'Login exitoso', token, usuario });
}

module.exports = { iniciarSesion };
