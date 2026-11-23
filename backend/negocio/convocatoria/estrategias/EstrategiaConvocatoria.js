// EstrategiaConvocatoria «Strategy»: decide en qué orden se convoca a los
// meseros activos para un domingo. Los primeros N (meseros_requeridos)
// quedan convocados y el resto en descanso.
//
// ordenar(candidatos, fechaDomingo) recibe [{ mesero: Mesero, totalReciente }]
// y devuelve los Mesero ordenados de mayor a menor prioridad.
class EstrategiaConvocatoria {
    get nombre() {
        throw new Error('EstrategiaConvocatoria.nombre no implementado');
    }

    ordenar(candidatos, fechaDomingo) {
        throw new Error('EstrategiaConvocatoria.ordenar no implementado');
    }
}

module.exports = EstrategiaConvocatoria;
