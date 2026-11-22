const Usuario = require('./Usuario');

const MS_POR_DIA = 24 * 60 * 60 * 1000;

class Mesero extends Usuario {
    constructor({ meseroId, identificacion, apellido, fechaIngreso, ...datos }) {
        super({ ...datos, rol: 'MESERO' });
        this.meseroId = meseroId;
        this.identificacion = identificacion;
        this.apellido = apellido;
        this.fechaIngreso = fechaIngreso;
    }

    // Construye el mesero desde una fila de la tabla meseros.
    static desdeFila(fila) {
        return new Mesero({
            id: fila.user_id ?? null,
            meseroId: fila.id,
            identificacion: fila.identificacion,
            nombre: fila.nombre,
            apellido: fila.apellido,
            fechaIngreso: fila.fecha_ingreso,
            estado: fila.estado
        });
    }

    nombreCompleto() {
        return `${this.nombre} ${this.apellido}`.trim();
    }

    // Días desde el ingreso hasta la fecha de referencia (YYYY-MM-DD).
    antiguedadEnDias(fechaReferencia) {
        const desde = Date.parse(`${this.fechaIngreso}T00:00:00Z`);
        const hasta = Date.parse(`${fechaReferencia}T00:00:00Z`);

        return Number.isNaN(desde) || Number.isNaN(hasta)
            ? 0
            : Math.max(0, Math.floor((hasta - desde) / MS_POR_DIA));
    }
}

module.exports = Mesero;
