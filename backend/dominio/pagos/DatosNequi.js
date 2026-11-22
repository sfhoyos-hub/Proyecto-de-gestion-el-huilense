// Datos que necesita la pasarela para enviar un pago (independientes del
// formato de la API de Nequi: el adaptador los traduce).
class DatosNequi {
    constructor({ numeroCelular, monto, referencia, descripcion = '' }) {
        if (!(Number.isFinite(monto) && monto > 0)) {
            throw new Error('El monto del pago debe ser mayor a 0');
        }

        this.numeroCelular = numeroCelular;
        this.monto = monto;
        this.referencia = referencia;
        this.descripcion = descripcion;
    }
}

module.exports = DatosNequi;
