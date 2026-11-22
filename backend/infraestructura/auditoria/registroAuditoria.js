// Implementación de IAuditoria: convierte cada evento en una fila de la
// tabla auditoria. Los cambios se registran DENTRO de la transacción que los
// produce (si la auditoría falla, el cambio no se guarda).
const IAuditoria = require('../../dominio/puertos/IAuditoria');
const repositorio = require('./auditoria.repository');

const TIPO = Object.freeze({
    ACCESO_DENEGADO: 'ACCESO_DENEGADO',
    CAMBIO_MONTO: 'CAMBIO_MONTO',
    CAMBIO_CUENTA: 'CAMBIO_CUENTA'
});

// Convierte valores a texto; nunca se guardan contraseñas ni hashes.
function aTexto(valor) {
    if (valor === undefined || valor === null) {
        return null;
    }

    return typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
}

function registroDeAcceso(evento) {
    return {
        tipo: TIPO.ACCESO_DENEGADO,
        usuarioId: evento.usuarioId ?? null,
        rol: evento.rol ?? null,
        accion: `${evento.metodo} ${evento.ruta}`,
        detalle: `${evento.estadoHttp}: ${evento.motivo}`,
        ip: evento.ip ?? null
    };
}

function registroDeCambio(tipo, evento) {
    return {
        tipo,
        usuarioId: evento.usuario?.id ?? null,
        rol: evento.usuario?.rol ?? null,
        accion: `${tipo}:${evento.entidad}`,
        entidad: evento.entidad,
        entidadId: evento.entidadId ?? null,
        valorAnterior: aTexto(evento.anterior),
        valorNuevo: aTexto(evento.nuevo),
        detalle: aTexto(evento.detalle)
    };
}

class RegistroAuditoria extends IAuditoria {
    constructor(repo) {
        super();
        this.repo = repo;
    }

    guardar(registro) {
        return this.repo.insertar({
            entidad: null,
            entidadId: null,
            valorAnterior: null,
            valorNuevo: null,
            detalle: null,
            ip: null,
            ...registro,
            fecha: new Date().toISOString()
        });
    }

    registrarAccesoDenegado(evento) {
        return this.guardar(registroDeAcceso(evento));
    }

    registrarCambioMonto(evento) {
        return this.guardar(registroDeCambio(TIPO.CAMBIO_MONTO, evento));
    }

    registrarCambioCuenta(evento) {
        return this.guardar(registroDeCambio(TIPO.CAMBIO_CUENTA, evento));
    }
}

const auditoria = new RegistroAuditoria(repositorio);

module.exports = { RegistroAuditoria, auditoria, TIPO };
