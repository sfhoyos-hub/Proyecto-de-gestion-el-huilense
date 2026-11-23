// Entrega de notificaciones (diagrama de arquitectura, capa 5).
// Es un Observador suscrito al Gestor de notificaciones: cada notificación
// que recibe queda guardada en la bandeja del mesero (tabla notificaciones).
const Observador = require('../../dominio/usuarios/Observador');

class EntregaNotificaciones extends Observador {
    constructor(repositorio) {
        super();
        this.repositorio = repositorio;
    }

    actualizar(notificacion) {
        return this.repositorio.insertar(notificacion);
    }
}

module.exports = { EntregaNotificaciones };
