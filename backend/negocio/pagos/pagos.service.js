// Pagos: cuentas Nequi de los meseros y pago de bonificaciones a través del
// puerto IPasarelaPago (el adaptador de Nequi vive en infraestructura).
// Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const CuentaNequi = require('../../dominio/usuarios/CuentaNequi');
const { Bonificacion } = require('../../dominio/bonificaciones');
const { SolicitudPago, DatosNequi } = require('../../dominio/pagos');
const notificaciones = require('../notificaciones/GestorNotificaciones');
const { AppError } = require('../../utils/errores');
const { esIdValido } = require('../../utils/validaciones');

const repo = puerto('repositorio.pagos');
const pasarela = puerto('pasarelaPago');
const auditoria = puerto('auditoria');

const formatoCOP = (valor) => Number(valor).toLocaleString('es-CO');

function validarId(valor, mensaje) {
    if (!esIdValido(valor)) {
        throw new AppError(400, mensaje);
    }

    return Number(valor);
}

function respuestaCuenta(cuenta) {
    return {
        mesero_id: cuenta.meseroId,
        numero_celular: cuenta.numeroCelular,
        numero_enmascarado: cuenta.numeroEnmascarado()
    };
}

// ---------- Cuentas Nequi ----------

async function obtenerCuenta(meseroIdParam) {
    const meseroId = validarId(meseroIdParam, 'El ID del mesero no es válido.');
    const fila = await repo.buscarCuenta(meseroId);

    if (!fila) {
        throw new AppError(404, 'El mesero no tiene una cuenta Nequi registrada.');
    }

    return respuestaCuenta(new CuentaNequi({
        id: fila.id, meseroId: fila.mesero_id, numeroCelular: fila.numero_celular
    }));
}

// El cambio de cuenta queda en la auditoría (solo los 4 últimos dígitos).
async function guardarCuenta(meseroIdParam, body, usuario) {
    const meseroId = validarId(meseroIdParam, 'El ID del mesero no es válido.');
    const numero = typeof body?.numero_celular === 'string' ? body.numero_celular.trim() : '';

    if (!CuentaNequi.esCelularValido(numero)) {
        throw new AppError(400, 'El número Nequi debe ser un celular de 10 dígitos que empiece por 3.');
    }

    if (!await repo.existeMesero(meseroId)) {
        throw new AppError(404, 'Mesero no encontrado.');
    }

    const cuenta = new CuentaNequi({ meseroId, numeroCelular: numero });

    await repo.enTransaccion(async () => {
        const anterior = await repo.buscarCuenta(meseroId);

        await repo.guardarCuenta(meseroId, numero);
        await auditoria.registrarCambioCuenta({
            usuario,
            entidad: 'CUENTA_NEQUI',
            entidadId: meseroId,
            anterior: anterior
                ? new CuentaNequi({ meseroId, numeroCelular: anterior.numero_celular }).numeroEnmascarado()
                : null,
            nuevo: cuenta.numeroEnmascarado()
        });
    });

    return respuestaCuenta(cuenta);
}

// ---------- Pago de bonificaciones ----------

async function obtenerBonificacionPorPagar(id) {
    const fila = await repo.buscarBonificacion(id);

    if (!fila) {
        throw new AppError(404, 'Bonificación no encontrada.');
    }

    const bonificacion = Bonificacion.desdeFila(fila);

    if (bonificacion.estaPagada()) {
        throw new AppError(409, 'Esta bonificación ya fue pagada.');
    }

    return bonificacion;
}

async function obtenerCuentaDelMesero(meseroId) {
    const fila = await repo.buscarCuenta(meseroId);

    if (!fila) {
        throw new AppError(409, 'El mesero no tiene una cuenta Nequi registrada.');
    }

    return new CuentaNequi({ meseroId, numeroCelular: fila.numero_celular });
}

// Reserva el pago (estado pendiente). Las transacciones van una detrás de
// otra, así dos clics seguidos no pueden pagar dos veces la misma bonificación.
// shortcut: si el servidor se cae con la solicitud en "pendiente" queda
// bloqueada; agregar un proceso que la pase a "error" si el sistema crece.
function reservarPago(bonificacionId) {
    return repo.enTransaccion(async () => {
        const fila = await repo.buscarBonificacion(bonificacionId);
        const previa = await repo.buscarSolicitud(bonificacionId);

        if (Bonificacion.desdeFila(fila).estaPagada() ||
            (previa && !SolicitudPago.desdeFila(previa).puedeReintentarse())) {
            throw new AppError(409, 'Ya existe un pago en curso o confirmado para esta bonificación.');
        }

        const solicitud = new SolicitudPago({ bonificacionId });

        await repo.guardarSolicitud(solicitud);

        return solicitud;
    });
}

async function registrarRechazo(solicitud, mensaje) {
    solicitud.fallar(mensaje);
    await repo.enTransaccion(() => repo.guardarSolicitud(solicitud));

    throw new AppError(502, `El pago no se pudo completar: ${mensaje}`);
}

function registrarConfirmacion(solicitud, bonificacion, referencia, usuario) {
    solicitud.confirmar();

    return repo.enTransaccion(async () => {
        await repo.guardarSolicitud(solicitud);
        await repo.marcarBonificacionPagada(bonificacion.id);
        await auditoria.registrarCambioMonto({
            usuario,
            entidad: 'PAGO',
            entidadId: bonificacion.id,
            anterior: null,
            nuevo: bonificacion.monto,
            detalle: { mesero_id: bonificacion.meseroId, estado: 'PAGADA', referencia }
        });
        await notificaciones.notificarA(
            [bonificacion.meseroId],
            notificaciones.TIPO.PAGO,
            () => `Te enviamos $${formatoCOP(bonificacion.monto)} a tu Nequi por tu bonificación.`
        );
    });
}

async function pagarBonificacion(idParam, usuario) {
    const id = validarId(idParam, 'El ID de la bonificación no es válido.');
    const bonificacion = await obtenerBonificacionPorPagar(id);
    const cuenta = await obtenerCuentaDelMesero(bonificacion.meseroId);
    const solicitud = await reservarPago(id);

    // La llamada al sistema externo va fuera de cualquier transacción.
    const resultado = await pasarela.procesarPago(new DatosNequi({
        numeroCelular: cuenta.numeroCelular,
        monto: bonificacion.monto,
        referencia: `BON-${bonificacion.id}`,
        descripcion: 'Bonificación Top 6 - El Huilense'
    }));

    if (!resultado.exito) {
        await registrarRechazo(solicitud, resultado.mensaje || 'Nequi rechazó el pago');
    }

    await registrarConfirmacion(solicitud, bonificacion, resultado.referencia, usuario);

    return {
        bonificacion_id: bonificacion.id,
        mesero_id: bonificacion.meseroId,
        monto: bonificacion.monto,
        estado: solicitud.estado,
        referencia: resultado.referencia || null,
        cuenta: cuenta.numeroEnmascarado()
    };
}

function listarSolicitudes() {
    return repo.listarSolicitudes();
}

module.exports = { obtenerCuenta, guardarCuenta, pagarBonificacion, listarSolicitudes };
