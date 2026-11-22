// Paquete dominio.puertos
module.exports = {
    IRepositorio: require('./IRepositorio'),
    IAuditoria: require('./IAuditoria'),
    IPasarelaPago: require('./IPasarelaPago'),
    ...require('./registro')
};
