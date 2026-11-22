class Venta {
    constructor({ id = null, meseroId, domingoId, totalVendido }) {
        this.id = id;
        this.meseroId = meseroId;
        this.domingoId = domingoId;
        this.totalVendido = totalVendido;
    }
}

module.exports = Venta;
