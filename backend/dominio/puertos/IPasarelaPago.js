// Puerto IPasarelaPago (diagrama de paquetes: dominio.puertos).
// Contrato que usa el paquete de Pagos para enviar dinero a un mesero. La
// implementación es el adaptador de Nequi (infraestructura/nequi).
//
// procesarPago(datosNequi) recibe un DatosNequi (dominio.pagos) y devuelve
//   { exito: boolean, referencia?: string, mensaje?: string }
// Nunca lanza por un rechazo del proveedor: lo informa con exito = false.

class IPasarelaPago {
    procesarPago(datosNequi) {
        throw new Error('IPasarelaPago.procesarPago no implementado');
    }
}

module.exports = IPasarelaPago;
