// Jornada dominical: tiene un cupo de meseros y se cierra con el corte.
class Domingo {
    constructor({ id = null, fecha, temporadaId = null, meserosRequeridos, cerrado = false }) {
        this.id = id;
        this.fecha = fecha;
        this.temporadaId = temporadaId;
        this.meserosRequeridos = meserosRequeridos;
        this.cerrado = cerrado;
    }

    static desdeFila(fila) {
        return new Domingo({
            id: fila.id,
            fecha: fila.fecha,
            temporadaId: fila.temporada_id,
            meserosRequeridos: fila.meseros_requeridos,
            cerrado: fila.cerrado === 1
        });
    }

    estaCerrado() {
        return this.cerrado;
    }
}

module.exports = Domingo;
