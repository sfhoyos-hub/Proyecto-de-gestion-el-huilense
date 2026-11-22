const Usuario = require('./Usuario');

class Administrador extends Usuario {
    constructor(datos) {
        super({ ...datos, rol: 'ADMIN' });
    }
}

module.exports = Administrador;
