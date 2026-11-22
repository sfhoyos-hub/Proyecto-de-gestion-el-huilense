// Puerto IAuditoria (diagrama de componentes): contrato que usa la lógica de
// negocio para dejar rastro de los accesos denegados y de los cambios de
// montos y cuentas. La implementación vive en infraestructura/auditoria.
//
// Evento de acceso denegado:
//   { usuarioId?, rol?, metodo, ruta, ip?, motivo, estadoHttp }
// Evento de cambio (monto o cuenta):
//   { usuario?, entidad, entidadId?, anterior?, nuevo?, detalle? }
//   donde usuario es { id, rol } de quien realiza el cambio.

class IAuditoria {
    registrarAccesoDenegado(evento) {
        throw new Error('IAuditoria.registrarAccesoDenegado no implementado');
    }

    registrarCambioMonto(evento) {
        throw new Error('IAuditoria.registrarCambioMonto no implementado');
    }

    registrarCambioCuenta(evento) {
        throw new Error('IAuditoria.registrarCambioCuenta no implementado');
    }
}

module.exports = IAuditoria;
