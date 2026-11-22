// Estado de un mesero dentro de una convocatoria (valores de la tabla convocatorias).
const ESTADO_CONVOCATORIA = Object.freeze({
    CONVOCADO: 'convocado',
    DESCANSO: 'descanso'
});

class DetalleConvocatoria {
    constructor({ mesero, estado, orden }) {
        this.mesero = mesero;
        this.estado = estado;
        this.orden = orden;
    }

    estaConvocado() {
        return this.estado === ESTADO_CONVOCATORIA.CONVOCADO;
    }

    toJSON() {
        return {
            orden: this.orden,
            mesero_id: this.mesero.meseroId,
            nombre: this.mesero.nombre,
            apellido: this.mesero.apellido,
            estado: this.estado
        };
    }
}

module.exports = { DetalleConvocatoria, ESTADO_CONVOCATORIA };
