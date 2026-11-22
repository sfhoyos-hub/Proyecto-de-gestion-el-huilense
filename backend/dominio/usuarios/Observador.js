// Observador (patrón Observer). Quien quiera enterarse de una notificación
// implementa actualizar(notificacion). El sujeto es el Gestor de
// notificaciones (negocio/notificaciones).
class Observador {
    actualizar(notificacion) {
        throw new Error('Observador.actualizar no implementado');
    }
}

module.exports = Observador;
