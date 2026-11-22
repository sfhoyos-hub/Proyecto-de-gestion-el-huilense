// Puesto de un mesero en el ranking de un domingo.
class ResultadoRanking {
    constructor({ meseroId, posicion, totalVendido, top6 }) {
        this.meseroId = meseroId;
        this.posicion = posicion;
        this.totalVendido = totalVendido;
        this.top6 = Boolean(top6);
    }

    esTop6() {
        return this.top6;
    }
}

module.exports = ResultadoRanking;
