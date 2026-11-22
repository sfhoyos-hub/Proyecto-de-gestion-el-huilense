// Solicitud de pago de una bonificación (valores de la tabla solicitudes_pago).
const ESTADO_PAGO = Object.freeze({
    PENDIENTE: 'pendiente',
    CONFIRMADO: 'confirmado',
    CANCELADO: 'cancelado',
    ERROR: 'error'
});

class SolicitudPago {
    constructor({ id = null, bonificacionId, estado = ESTADO_PAGO.PENDIENTE,
        fechaSolicitud = new Date().toISOString(), fechaConfirmacion = null, mensajeError = null }) {
        this.id = id;
        this.bonificacionId = bonificacionId;
        this.estado = estado;
        this.fechaSolicitud = fechaSolicitud;
        this.fechaConfirmacion = fechaConfirmacion;
        this.mensajeError = mensajeError;
    }

    static desdeFila(fila) {
        return new SolicitudPago({
            id: fila.id,
            bonificacionId: fila.bonificacion_id,
            estado: fila.estado,
            fechaSolicitud: fila.fecha_solicitud,
            fechaConfirmacion: fila.fecha_confirmacion,
            mensajeError: fila.mensaje_error
        });
    }

    // Solo se puede (re)intentar si nunca se pidió o si el intento anterior falló.
    puedeReintentarse() {
        return [ESTADO_PAGO.ERROR, ESTADO_PAGO.CANCELADO].includes(this.estado);
    }

    confirmar() {
        this.estado = ESTADO_PAGO.CONFIRMADO;
        this.fechaConfirmacion = new Date().toISOString();
        this.mensajeError = null;
    }

    fallar(mensaje) {
        this.estado = ESTADO_PAGO.ERROR;
        this.mensajeError = mensaje;
    }
}

module.exports = { SolicitudPago, ESTADO_PAGO };
