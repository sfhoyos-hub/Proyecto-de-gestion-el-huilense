const MAX_NOMBRE = 80;

class Temporada {
    constructor({ id = null, nombre }) {
        this.id = id;
        this.nombre = nombre;
    }

    static esNombreValido(nombre) {
        return typeof nombre === 'string' && nombre.trim() !== '' &&
            nombre.trim().length <= MAX_NOMBRE;
    }
}

module.exports = Temporada;
