const { ESTADO_BONIFICACION } = require('../../utils/estados');

class Bonificacion {
    constructor({ id = null, rankingId, meseroId, monto, estado = ESTADO_BONIFICACION.REGISTRADA }) {
        this.id = id;
        this.rankingId = rankingId;
        this.meseroId = meseroId;
        this.monto = monto;
        this.estado = estado;
    }

    static desdeFila(fila) {
        return new Bonificacion({
            id: fila.id,
            rankingId: fila.ranking_id,
            meseroId: fila.mesero_id,
            monto: fila.monto,
            estado: fila.estado
        });
    }

    estaPagada() {
        return this.estado === ESTADO_BONIFICACION.PAGADA;
    }
}

module.exports = Bonificacion;
