// Puerto IRepositorio (diagrama de paquetes: dominio.puertos).
// Contrato común de todos los repositorios. La lógica de negocio solo conoce
// este puerto; la implementación con SQL vive en
// infraestructura/persistencia/repositorios (cada repositorio agrega sus
// propias consultas sobre este contrato).

class IRepositorio {
    // Ejecuta fn dentro de una transacción ACID: todo se guarda o nada.
    enTransaccion(fn) {
        throw new Error('IRepositorio.enTransaccion no implementado');
    }
}

module.exports = IRepositorio;
