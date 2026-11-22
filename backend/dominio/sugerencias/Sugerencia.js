// Sugerencia anónima del formulario público.
const MIN = 5;
const MAX = 1000;

class Sugerencia {
    constructor({ id = null, contenido, fecha = new Date().toISOString() }) {
        this.id = id;
        this.contenido = contenido;
        this.fecha = fecha;
    }

    static validarContenido(contenido) {
        const texto = typeof contenido === 'string' ? contenido.trim() : '';

        if (texto.length < MIN || texto.length > MAX) {
            return null;
        }

        return texto;
    }
}

Sugerencia.MIN = MIN;
Sugerencia.MAX = MAX;

module.exports = Sugerencia;
