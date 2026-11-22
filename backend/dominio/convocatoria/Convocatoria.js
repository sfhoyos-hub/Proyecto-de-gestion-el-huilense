// Convocatoria de un domingo: los primeros N meseros (según la estrategia)
// quedan convocados y el resto en descanso.
const { DetalleConvocatoria, ESTADO_CONVOCATORIA } = require('./DetalleConvocatoria');

class Convocatoria {
    constructor({ domingo, estrategia, detalles = [] }) {
        this.domingo = domingo;
        this.estrategia = estrategia;
        this.detalles = detalles;
    }

    // meserosOrdenados ya viene ordenado por la estrategia.
    static crear(domingo, estrategia, meserosOrdenados) {
        const detalles = meserosOrdenados.map((mesero, indice) => new DetalleConvocatoria({
            mesero,
            orden: indice + 1,
            estado: indice < domingo.meserosRequeridos
                ? ESTADO_CONVOCATORIA.CONVOCADO
                : ESTADO_CONVOCATORIA.DESCANSO
        }));

        return new Convocatoria({ domingo, estrategia, detalles });
    }

    convocados() {
        return this.detalles.filter((detalle) => detalle.estaConvocado());
    }

    enDescanso() {
        return this.detalles.filter((detalle) => !detalle.estaConvocado());
    }

    toJSON() {
        return {
            domingo_id: this.domingo.id,
            fecha: this.domingo.fecha,
            estrategia: this.estrategia,
            meseros_requeridos: this.domingo.meserosRequeridos,
            convocados: this.convocados(),
            descanso: this.enDescanso()
        };
    }
}

module.exports = Convocatoria;
