// Reportes e historial. Solo lectura. Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const { Reporte } = require('../../dominio/reportes');
const { AppError } = require('../../utils/errores');
const { esFechaValida, esIdValido } = require('../../utils/validaciones');

const repo = puerto('repositorio.reportes');

function validarRango(desde, hasta) {
    if (!esFechaValida(desde) || !esFechaValida(hasta)) {
        throw new AppError(400, 'Indica desde y hasta con el formato YYYY-MM-DD.');
    }

    if (desde > hasta) {
        throw new AppError(400, 'La fecha "desde" no puede ser posterior a "hasta".');
    }
}

async function resumen({ desde, hasta } = {}) {
    validarRango(desde, hasta);

    return new Reporte({
        titulo: 'Resumen de desempeño por mesero',
        filtros: { desde, hasta },
        filas: await repo.resumenPorMesero(desde, hasta),
        totales: ['total_vendido', 'total_bonificaciones']
    });
}

// Un mesero solo puede ver su propio historial.
function verificarPermiso(meseroId, usuario) {
    if (usuario.rol === 'MESERO' && Number(usuario.mesero_id) !== meseroId) {
        throw new AppError(403, 'No tienes permiso para consultar el historial de otro mesero.');
    }
}

async function historial(meseroIdParam, usuario) {
    if (!esIdValido(meseroIdParam)) {
        throw new AppError(400, 'El ID del mesero no es válido.');
    }

    const meseroId = Number(meseroIdParam);

    verificarPermiso(meseroId, usuario);

    const mesero = await repo.existeMesero(meseroId);

    if (!mesero) {
        throw new AppError(404, 'Mesero no encontrado.');
    }

    return new Reporte({
        titulo: `Historial de ${mesero.nombre} ${mesero.apellido}`,
        filtros: { mesero_id: meseroId },
        filas: await repo.historialDeMesero(meseroId),
        totales: ['total_vendido', 'bonificacion']
    });
}

module.exports = { resumen, historial };
