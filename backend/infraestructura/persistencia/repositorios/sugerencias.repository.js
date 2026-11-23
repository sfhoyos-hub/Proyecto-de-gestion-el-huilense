// Solo SQL.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

function insertar(sugerencia) {
    return getDB().run(
        'INSERT INTO sugerencias (contenido, fecha) VALUES (?, ?)',
        [sugerencia.contenido, sugerencia.fecha]
    );
}

function listar() {
    return getDB().all('SELECT id, contenido, fecha FROM sugerencias ORDER BY fecha DESC, id DESC');
}

module.exports = crearRepositorio({ insertar, listar });
