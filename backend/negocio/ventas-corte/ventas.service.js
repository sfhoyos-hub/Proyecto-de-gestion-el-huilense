// Reglas de negocio de ventas. Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const repo = puerto('repositorio.ventas');
const domingosRepo = puerto('repositorio.domingos');
const { AppError } = require('../../utils/errores');
const { ESTADO_USUARIO } = require('../../utils/estados');
const auditoria = puerto('auditoria');
const {
    esFechaValida,
    esIdValido,
    obtenerMontoValido
} = require('../../utils/validaciones');

const MSG_FECHA = 'La fecha debe ser una fecha real con formato YYYY-MM-DD.';

// ---------- Validación de datos (se reutiliza en POST y PUT) ----------

function exigirCamposVenta({ mesero_id, fecha, total_vendido }) {
    if (mesero_id === undefined || !fecha || total_vendido === undefined) {
        throw new AppError(400,
            'Todos los campos son requeridos: mesero_id, fecha, total_vendido.');
    }
}

function exigirIdPositivo(id, mensaje) {
    if (!esIdValido(id)) {
        throw new AppError(400, mensaje);
    }

    return Number(id);
}

function exigirFecha(fecha) {
    if (!esFechaValida(fecha)) {
        throw new AppError(400, MSG_FECHA);
    }
}

function exigirMonto(valor) {
    const monto = obtenerMontoValido(valor);

    if (monto === null) {
        throw new AppError(400,
            'El monto vendido debe ser un número finito igual o mayor a 0.');
    }

    return monto;
}

function validarDatosVenta(body) {
    exigirCamposVenta(body);

    const meseroId = exigirIdPositivo(
        body.mesero_id, 'mesero_id debe ser un entero positivo.'
    );
    exigirFecha(body.fecha);

    return { meseroId, fecha: body.fecha, monto: exigirMonto(body.total_vendido) };
}

// ---------- Verificaciones contra la base de datos ----------

async function verificarMeseroActivo(meseroId) {
    const mesero = await repo.buscarMeseroPorId(meseroId);

    if (!mesero) {
        throw new AppError(404, 'El mesero indicado no existe.');
    }

    if (mesero.estado !== ESTADO_USUARIO.ACTIVO) {
        throw new AppError(400,
            'El mesero no está activo y no puede tener ventas registradas.');
    }
}

async function obtenerDomingoAbierto(fecha) {
    const domingo = await domingosRepo.buscarPorFecha(fecha);

    if (!domingo) {
        throw new AppError(404, 'No existe un domingo registrado con esa fecha.');
    }

    if (Number(domingo.cerrado) === 1) {
        throw new AppError(409,
            'El domingo está cerrado y no permite registrar o modificar ventas.');
    }

    return domingo;
}

async function verificarVentaDuplicada(meseroId, domingoId, opciones) {
    const { excluirId, mensaje } = opciones;

    if (await repo.buscarVentaDuplicada(meseroId, domingoId, excluirId)) {
        throw new AppError(409, mensaje);
    }
}

async function obtenerVentaEditable(id) {
    const venta = await repo.buscarVentaConDomingo(id);

    if (!venta) {
        throw new AppError(404, 'La venta indicada no existe.');
    }

    if (Number(venta.cerrado) === 1) {
        throw new AppError(409,
            'La venta pertenece a un domingo cerrado y no puede modificarse.');
    }

    return venta;
}

// ---------- Persistencia con auditoría (misma transacción) ----------

// Todo cambio de monto de una venta queda registrado: quién, cuándo y de/a cuánto.
function auditarMonto(usuario, ventaId, anterior, nuevo, detalle) {
    return auditoria.registrarCambioMonto({
        usuario, entidad: 'VENTA', entidadId: ventaId, anterior, nuevo, detalle
    });
}

function insertarAuditada({ meseroId, domingo, monto }, usuario) {
    return repo.enTransaccion(async () => {
        const resultado = await repo.insertar(meseroId, domingo.id, monto);

        await auditarMonto(usuario, resultado.lastID, null, monto,
            { mesero_id: meseroId, fecha: domingo.fecha });

        return resultado.lastID;
    });
}

function actualizarAuditada(venta, { meseroId, domingo, monto }, usuario) {
    return repo.enTransaccion(async () => {
        await repo.actualizar(venta.id, meseroId, domingo.id, monto);
        await auditarMonto(usuario, venta.id, venta.total_vendido, monto, {
            mesero_id_anterior: venta.mesero_id,
            mesero_id: meseroId,
            fecha: domingo.fecha
        });
    });
}

// ---------- Operaciones ----------

async function registrarVenta(body, usuario) {
    const { meseroId, fecha, monto } = validarDatosVenta(body);

    await verificarMeseroActivo(meseroId);

    const domingo = await obtenerDomingoAbierto(fecha);

    await verificarVentaDuplicada(meseroId, domingo.id, {
        mensaje: 'Ya existe una venta para este mesero en esta fecha. Use PUT para editarla.'
    });

    const id = await insertarAuditada({ meseroId, domingo, monto }, usuario);

    return repo.buscarResumenPorId(id);
}

function verificarDuplicadoAlEditar(id, meseroId, domingoId) {
    return verificarVentaDuplicada(meseroId, domingoId, {
        excluirId: id,
        mensaje: 'Ya existe otra venta para este mesero en esta fecha.'
    });
}

async function editarVenta(idParam, body, usuario) {
    const id = exigirIdPositivo(
        idParam, 'El identificador de la venta debe ser un entero positivo.'
    );
    const { meseroId, fecha, monto } = validarDatosVenta(body);
    const venta = await obtenerVentaEditable(id);

    await verificarMeseroActivo(meseroId);

    const domingo = await obtenerDomingoAbierto(fecha);

    await verificarDuplicadoAlEditar(id, meseroId, domingo.id);
    await actualizarAuditada(venta, { meseroId, domingo, monto }, usuario);

    return repo.buscarResumenPorId(id);
}

function listarVentas(fecha) {
    if (fecha !== undefined) {
        exigirFecha(fecha);
    }

    return repo.listar(fecha);
}

function verificarPermisoDeHistorial(meseroId, usuario) {
    if (usuario.rol === 'MESERO' && Number(usuario.mesero_id) !== meseroId) {
        throw new AppError(403,
            'No tienes permiso para consultar el historial de otro mesero.');
    }
}

async function historialDeMesero(meseroIdParam, usuario) {
    const meseroId = exigirIdPositivo(
        meseroIdParam,
        'El identificador del mesero debe ser un entero positivo.'
    );

    verificarPermisoDeHistorial(meseroId, usuario);

    if (!await repo.buscarMeseroPorId(meseroId)) {
        throw new AppError(404, 'El mesero indicado no existe.');
    }

    return repo.listarPorMesero(meseroId);
}

module.exports = {
    validarDatosVenta,
    registrarVenta,
    editarVenta,
    listarVentas,
    historialDeMesero
};
