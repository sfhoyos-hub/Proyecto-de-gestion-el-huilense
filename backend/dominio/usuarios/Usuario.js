// Usuario «abstract»: datos comunes de Administrador y Mesero.
// Todo usuario es un Observador: puede recibir notificaciones.
const Observador = require('./Observador');
const { ESTADO_USUARIO } = require('../../utils/estados');

class Usuario extends Observador {
    constructor({ id = null, nombre, email, rol, estado = ESTADO_USUARIO.ACTIVO }) {
        super();

        if (new.target === Usuario) {
            throw new Error('Usuario es abstracto: usa Administrador o Mesero');
        }

        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.rol = rol;
        this.estado = estado;
        this.bandeja = [];
    }

    estaActivo() {
        return this.estado === ESTADO_USUARIO.ACTIVO;
    }

    // Implementación por defecto del Observador: guarda la notificación en memoria.
    actualizar(notificacion) {
        this.bandeja.push(notificacion);
    }
}

module.exports = Usuario;
