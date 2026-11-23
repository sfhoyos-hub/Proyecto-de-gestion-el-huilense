// Sugerencias del formulario público. Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const { Sugerencia } = require('../../dominio/sugerencias');
const { AppError } = require('../../utils/errores');

const repo = puerto('repositorio.sugerencias');

async function crear(body) {
    const contenido = Sugerencia.validarContenido(body?.contenido);

    if (!contenido) {
        throw new AppError(400,
            `La sugerencia debe tener entre ${Sugerencia.MIN} y ${Sugerencia.MAX} caracteres.`);
    }

    const sugerencia = new Sugerencia({ contenido });
    const resultado = await repo.insertar(sugerencia);

    sugerencia.id = resultado.lastID;

    return sugerencia;
}

function listar() {
    return repo.listar();
}

module.exports = { crear, listar };
