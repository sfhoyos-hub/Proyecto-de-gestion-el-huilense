// Prioriza a quien más vendió en los últimos domingos cerrados.
// Empate: el de mayor antigüedad.
const EstrategiaConvocatoria = require('./EstrategiaConvocatoria');

class EstrategiaPorRendimiento extends EstrategiaConvocatoria {
    get nombre() {
        return 'rendimiento';
    }

    ordenar(candidatos, fechaDomingo) {
        return [...candidatos]
            .sort((a, b) => (b.totalReciente - a.totalReciente) ||
                (b.mesero.antiguedadEnDias(fechaDomingo) - a.mesero.antiguedadEnDias(fechaDomingo)) ||
                (a.mesero.meseroId - b.mesero.meseroId))
            .map((candidato) => candidato.mesero);
    }
}

module.exports = EstrategiaPorRendimiento;
