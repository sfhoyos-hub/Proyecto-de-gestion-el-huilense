// Ranking de un domingo: lista ordenada de resultados.
class Ranking {
    constructor({ domingoId, resultados = [] }) {
        this.domingoId = domingoId;
        this.resultados = resultados;
    }

    top6() {
        return this.resultados.filter((resultado) => resultado.esTop6());
    }

    puestoDe(meseroId) {
        return this.resultados.find((resultado) => resultado.meseroId === meseroId) || null;
    }
}

module.exports = Ranking;
