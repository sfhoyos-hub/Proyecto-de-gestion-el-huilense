// Temporadas a las que pertenece cada domingo. Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const Temporada = require('../../dominio/ventas/Temporada');
const { AppError } = require('../../utils/errores');

const repo = puerto('repositorio.temporadas');

function listar() {
    return repo.listar();
}

async function crear(body) {
    const nombre = body?.nombre;

    if (!Temporada.esNombreValido(nombre)) {
        throw new AppError(400, 'El nombre de la temporada es obligatorio (máximo 80 caracteres).');
    }

    const limpio = nombre.trim();

    if (await repo.buscarPorNombre(limpio)) {
        throw new AppError(409, 'Ya existe una temporada con ese nombre.');
    }

    const resultado = await repo.insertar(limpio);

    return new Temporada({ id: resultado.lastID, nombre: limpio });
}

module.exports = { listar, crear };
