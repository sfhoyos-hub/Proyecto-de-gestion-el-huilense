// Prioriza a quien lleva más tiempo en el restaurante.
const EstrategiaConvocatoria = require('./EstrategiaConvocatoria');

class EstrategiaPorAntiguedad extends EstrategiaConvocatoria {
    get nombre() {
        return 'antiguedad';
    }

    ordenar(candidatos, fechaDomingo) {
        return [...candidatos]
            .sort((a, b) =>
                (b.mesero.antiguedadEnDias(fechaDomingo) - a.mesero.antiguedadEnDias(fechaDomingo)) ||
                (a.mesero.meseroId - b.mesero.meseroId))
            .map((candidato) => candidato.mesero);
    }
}

module.exports = EstrategiaPorAntiguedad;
