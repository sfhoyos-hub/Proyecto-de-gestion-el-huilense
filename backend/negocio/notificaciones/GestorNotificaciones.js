// Gestor de notificaciones «Observer» (sujeto).
// Los demás paquetes de negocio le avisan de un evento (turno, ranking,
// bonificación, pago) y él lo reparte a todos los observadores suscritos.
// La raíz de composición suscribe la Entrega de notificaciones (infraestructura).
const Observador = require('../../dominio/usuarios/Observador');
const { Notificacion, TIPO_NOTIFICACION } = require('../../dominio/notificaciones');

class GestorNotificaciones {
    constructor() {
        this.observadores = [];
    }

    suscribir(observador) {
        if (!(observador instanceof Observador)) {
            throw new Error('Solo se pueden suscribir objetos Observador');
        }

        this.observadores.push(observador);
    }

    desuscribir(observador) {
        this.observadores = this.observadores.filter((o) => o !== observador);
    }

    async notificar(notificacion) {
        for (const observador of this.observadores) {
            await observador.actualizar(notificacion);
        }
    }

    // Atajo: una notificación del mismo tipo para varios meseros.
    async notificarA(meseroIds, tipo, crearMensaje) {
        for (const meseroId of meseroIds) {
            await this.notificar(new Notificacion({
                meseroId, tipo, mensaje: crearMensaje(meseroId)
            }));
        }
    }
}

// Una sola instancia para toda la aplicación.
const gestor = new GestorNotificaciones();

module.exports = gestor;
module.exports.GestorNotificaciones = GestorNotificaciones;
module.exports.TIPO = TIPO_NOTIFICACION;
