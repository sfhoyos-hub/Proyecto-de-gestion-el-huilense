// Solo SQL.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

function listar() {
    return getDB().all('SELECT id, nombre FROM temporadas ORDER BY id DESC');
}

function buscarPorNombre(nombre) {
    return getDB().get('SELECT id FROM temporadas WHERE nombre = ?', [nombre]);
}

function insertar(nombre) {
    return getDB().run('INSERT INTO temporadas (nombre) VALUES (?)', [nombre]);
}

module.exports = crearRepositorio({ listar, buscarPorNombre, insertar });
