// Reglas de negocio de bonificaciones (RF-07). Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const repo = puerto('repositorio.bonificaciones');
const domingosRepo = puerto('repositorio.domingos');
const { AppError } = require('../../utils/errores');
const { esFechaValida, obtenerMontoValido } = require('../../utils/validaciones');
const { ESTADO_BONIFICACION } = require('../../utils/estados');
const auditoria = puerto('auditoria');

const MONTO_POR_DEFECTO = 10000;
const MSG_FORMATO = 'La fecha debe tener el formato YYYY-MM-DD.';

// ---------- Validaciones ----------

function validarFechaDeConsulta(fecha) {
    if (!fecha) {
        throw new AppError(400,
            'La fecha es requerida. Use el formato YYYY-MM-DD.');
    }

    if (!esFechaValida(fecha)) {
        throw new AppError(400, MSG_FORMATO);
    }
}

function validarFechaDelDomingo(fecha) {
    if (!fecha) {
        throw new AppError(400, 'La fecha del domingo es requerida.');
    }

    if (!esFechaValida(fecha)) {
        throw new AppError(400, MSG_FORMATO);
    }
}

function validarFechaDeEntrega(fechaEntrega) {
    if (!esFechaValida(fechaEntrega)) {
        throw new AppError(400,
            'La fecha de entrega debe tener el formato YYYY-MM-DD.');
    }
}

// Si el body no trae monto se usa el valor por defecto; si lo trae, debe ser > 0.
function resolverMonto(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return MONTO_POR_DEFECTO;
    }

    const monto = obtenerMontoValido(valor);

    if (monto === null || monto === 0) {
        throw new AppError(400, 'El monto debe ser un número mayor a 0.');
    }

    return monto;
}

function validarDatosGeneracion(body) {
    const { fecha, fecha_entrega, observaciones, monto } = body;
    const fechaEntrega = fecha_entrega || fecha;

    validarFechaDelDomingo(fecha);
    validarFechaDeEntrega(fechaEntrega);

    return {
        fecha,
        fechaEntrega,
        observaciones: observaciones || null,
        monto: resolverMonto(monto)
    };
}

// ---------- Pasos de la generación ----------

async function validarDomingoCerrado(fecha) {
    const domingo = await domingosRepo.buscarPorFecha(fecha);

    if (!domingo) {
        throw new AppError(404, 'No existe un domingo registrado con esa fecha.');
    }

    if (domingo.cerrado !== 1) {
        throw new AppError(400,
            'El domingo aún no está cerrado. No se pueden generar las bonificaciones.');
    }

    return domingo;
}

async function obtenerTop6(domingoId) {
    const top6 = await repo.obtenerTop6ConBonificacion(domingoId);

    if (top6.length === 0) {
        throw new AppError(400, 'No existe un Top 6 generado para este domingo.');
    }

    return top6;
}

function filtrarSinBonificacion(top6) {
    const pendientes = top6.filter((fila) => !fila.bonificacion_id);

    if (pendientes.length === 0) {
        throw new AppError(409,
            'Las bonificaciones de este Top 6 ya fueron generadas.');
    }

    return pendientes;
}

async function insertarUna(fila, datos) {
    const { monto, fechaEntrega, observaciones } = datos;
    const estado = ESTADO_BONIFICACION.REGISTRADA;
    const resultado = await repo.insertar({
        rankingId: fila.ranking_id, monto, fechaEntrega, observaciones, estado
    });

    return {
        id: resultado.lastID,
        ranking_id: fila.ranking_id,
        posicion: fila.posicion,
        mesero_id: fila.mesero_id,
        monto,
        fecha_entrega: fechaEntrega,
        observaciones,
        estado
    };
}

function auditarMonto(usuario, bonificacion) {
    return auditoria.registrarCambioMonto({
        usuario,
        entidad: 'BONIFICACION',
        entidadId: bonificacion.id,
        anterior: null,
        nuevo: bonificacion.monto,
        detalle: { mesero_id: bonificacion.mesero_id, posicion: bonificacion.posicion }
    });
}

// Todas las bonificaciones (y su auditoría) se guardan juntas o ninguna.
function insertarBonificaciones(pendientes, datos, usuario) {
    return repo.enTransaccion(async () => {
        const generadas = [];

        for (const fila of pendientes) {
            const generada = await insertarUna(fila, datos);

            await auditarMonto(usuario, generada);
            generadas.push(generada);
        }

        return generadas;
    });
}

function calcularTotal(bonificaciones) {
    return bonificaciones.reduce((suma, fila) => suma + fila.monto, 0);
}

// ---------- Operaciones ----------

async function generar(body, usuario) {
    const datos = validarDatosGeneracion(body);
    const domingo = await validarDomingoCerrado(datos.fecha);
    const top6 = await obtenerTop6(domingo.id);
    const pendientes = filtrarSinBonificacion(top6);

    return insertarBonificaciones(pendientes, datos, usuario);
}

function consultarPorFecha(fecha) {
    validarFechaDeConsulta(fecha);

    return repo.listarPorFecha(fecha);
}

async function obtenerPorId(id) {
    const bonificacion = await repo.buscarPorId(id);

    if (!bonificacion) {
        throw new AppError(404, 'Bonificación no encontrada.');
    }

    return bonificacion;
}

module.exports = { generar, consultarPorFecha, obtenerPorId, calcularTotal };
