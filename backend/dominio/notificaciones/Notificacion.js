// Tipos permitidos por la tabla notificaciones.
const TIPO_NOTIFICACION = Object.freeze({
    TURNO: 'turno',
    RANKING: 'ranking',
    BONIFICACION: 'bonificacion',
    PAGO: 'pago'
});

class Notificacion {
    constructor({ id = null, meseroId, tipo, mensaje, fecha = new Date().toISOString(), leida = false }) {
        if (!Object.values(TIPO_NOTIFICACION).includes(tipo)) {
            throw new Error(`Tipo de notificación inválido: ${tipo}`);
        }

        this.id = id;
        this.meseroId = meseroId;
        this.tipo = tipo;
        this.mensaje = mensaje;
        this.fecha = fecha;
        this.leida = leida;
    }
}

module.exports = { Notificacion, TIPO_NOTIFICACION };
