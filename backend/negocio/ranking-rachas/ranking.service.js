// Reglas de negocio del ranking (RF-03, RF-06). Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const repo = puerto('repositorio.ranking');
const domingosRepo = puerto('repositorio.domingos');
const { AppError } = require('../../utils/errores');
const { esFechaValida } = require('../../utils/validaciones');

const TAMANO_TOP = 6;

// ---------- Cálculo (funciones puras, sin base de datos) ----------

// Recibe las ventas ya ordenadas de mayor a menor.
function calcularPosiciones(ventasOrdenadas) {
    return ventasOrdenadas.map((venta, indice) => ({
        mesero_id: venta.mesero_id,
        posicion: indice + 1,
        total_vendido: venta.total_vendido,
        top6: indice + 1 <= TAMANO_TOP ? 1 : 0
    }));
}

function separarTop6(posiciones) {
    const ids = (filas) => filas.map((fila) => fila.mesero_id);

    return {
        top6: ids(posiciones.filter((fila) => fila.top6 === 1)),
        resto: ids(posiciones.filter((fila) => fila.top6 === 0))
    };
}

// ---------- Persistencia ----------

function obtenerVentasOrdenadas(domingoId) {
    return repo.obtenerVentasOrdenadas(domingoId);
}

async function guardarRanking(domingoId, posiciones) {
    for (const fila of posiciones) {
        await repo.insertar(domingoId, fila);
    }
}

// ---------- Validaciones ----------

function validarFechaDeConsulta(fecha) {
    if (!fecha) {
        throw new AppError(400,
            'La fecha es requerida. Use el formato YYYY-MM-DD.');
    }

    if (!esFechaValida(fecha)) {
        throw new AppError(400, 'La fecha debe tener el formato YYYY-MM-DD.');
    }
}

// ---------- Consultas del administrador ----------

function consultarRanking(fecha) {
    validarFechaDeConsulta(fecha);

    return repo.obtenerRanking(fecha, false);
}

function consultarTop6(fecha) {
    validarFechaDeConsulta(fecha);

    return repo.obtenerRanking(fecha, true);
}

// ---------- Consulta del mesero ----------

async function obtenerDomingoDelPuesto(fecha) {
    if (!esFechaValida(fecha)) {
        throw new AppError(400,
            'Debes proporcionar una fecha válida en formato YYYY-MM-DD');
    }

    const domingo = await domingosRepo.buscarPorFecha(fecha);

    if (!domingo) {
        throw new AppError(404, 'No existe un domingo registrado para esa fecha');
    }

    return domingo;
}

async function consultarMiPuesto(fecha, usuario) {
    const domingo = await obtenerDomingoDelPuesto(fecha);
    const puesto = await repo.buscarPuesto(domingo.id, usuario.mesero_id);

    if (!puesto) {
        throw new AppError(404,
            'Todavía no tienes un puesto registrado para esa fecha');
    }

    return puesto;
}

module.exports = {
    calcularPosiciones,
    separarTop6,
    obtenerVentasOrdenadas,
    guardarRanking,
    consultarRanking,
    consultarTop6,
    consultarMiPuesto
};
