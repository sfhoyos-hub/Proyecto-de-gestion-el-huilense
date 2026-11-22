// Cuenta Nequi de un mesero: número celular colombiano de 10 dígitos que empieza por 3.
const FORMATO_CELULAR = /^3\d{9}$/;

class CuentaNequi {
    constructor({ id = null, meseroId, numeroCelular }) {
        this.id = id;
        this.meseroId = meseroId;
        this.numeroCelular = numeroCelular;
    }

    static esCelularValido(numero) {
        return typeof numero === 'string' && FORMATO_CELULAR.test(numero);
    }

    // Para auditoría y respuestas: nunca se expone el número completo.
    numeroEnmascarado() {
        return `******${this.numeroCelular.slice(-4)}`;
    }
}

module.exports = CuentaNequi;
