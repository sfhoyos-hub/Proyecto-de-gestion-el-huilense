// Base de todos los repositorios: cada uno implementa el puerto IRepositorio
// (dominio/puertos) y agrega sus consultas SQL.
const IRepositorio = require('../../../dominio/puertos/IRepositorio');
const { implementar } = require('../../../dominio/puertos/registro');
const { enTransaccion } = require('../transaccion');

function crearRepositorio(consultas) {
    return implementar(IRepositorio, { enTransaccion, ...consultas });
}

module.exports = { crearRepositorio };
