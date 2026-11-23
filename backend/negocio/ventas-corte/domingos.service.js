// Reglas de negocio de domingos y cierre de corte (RF-03, RF-06, RF-19).
const { puerto } = require('../../dominio/puertos/registro');
const repo = puerto('repositorio.domingos');
const rankingService = require('../ranking-rachas/ranking.service');
const rachaService = require('../ranking-rachas/racha.service');
const notificaciones = require('../notificaciones/GestorNotificaciones');
const { AppError } = require('../../utils/errores');
const { esFechaValida, esDomingo } = require('../../utils/validaciones');

// ---------- Registro de domingos ----------

function validarCantidad(valor) {
    const cantidad = Number(valor);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new AppError(400,
            'meseros_requeridos debe ser un número entero mayor a 0.');
    }

    return cantidad;
}

function exigirCamposDomingo({ fecha, meseros_requeridos }) {
    if (!fecha || meseros_requeridos === undefined) {
        throw new AppError(400,
            'Todos los campos son requeridos: fecha, meseros_requeridos.');
    }
}

// La fecha debe existir en el calendario y caer en domingo.
function validarFechaDeDomingo(fecha) {
    if (!esFechaValida(fecha)) {
        throw new AppError(400, 'La fecha debe tener el formato YYYY-MM-DD.');
    }

    if (!esDomingo(fecha)) {
        throw new AppError(400, 'La fecha indicada no es un domingo.');
    }
}

function validarDatosDomingo(body) {
    exigirCamposDomingo(body);
    validarFechaDeDomingo(body.fecha);

    return {
        fecha: body.fecha,
        temporadaId: body.temporada_id ?? null,
        cantidad: validarCantidad(body.meseros_requeridos)
    };
}

async function verificarTemporada(temporadaId) {
    if (temporadaId !== null && !await repo.existeTemporada(temporadaId)) {
        throw new AppError(404, 'La temporada indicada no existe.');
    }
}

async function verificarFechaLibre(fecha) {
    if (await repo.buscarPorFecha(fecha)) {
        throw new AppError(409, 'Ya existe un domingo registrado con esa fecha.');
    }
}

async function registrar(body) {
    const { fecha, temporadaId, cantidad } = validarDatosDomingo(body);

    await verificarTemporada(temporadaId);
    await verificarFechaLibre(fecha);

    const resultado = await repo.insertar(fecha, temporadaId || null, cantidad);

    return repo.buscarPorId(resultado.lastID);
}

function listar() {
    return repo.listar();
}

async function obtenerPorId(id) {
    const domingo = await repo.buscarPorId(id);

    if (!domingo) {
        throw new AppError(404, 'El domingo indicado no existe.');
    }

    return domingo;
}

// ---------- Cierre de corte: un paso pequeño por función ----------

async function validarDomingoAbierto(domingoId) {
    const domingo = await repo.buscarEstadoDeCierre(domingoId);

    if (!domingo) {
        throw new AppError(404, 'El domingo indicado no existe.');
    }

    if (domingo.cerrado === 1) {
        throw new AppError(400, 'Este domingo ya se encuentra cerrado.');
    }
}

async function obtenerVentasParaCierre(domingoId) {
    const ventas = await rankingService.obtenerVentasOrdenadas(domingoId);

    if (ventas.length === 0) {
        throw new AppError(409,
            'No se puede cerrar el corte: no hay ventas registradas para este domingo.');
    }

    return ventas;
}

// Observer: cada mesero recibe su puesto (dentro de la misma transacción).
function avisarPuestos(posiciones) {
    const puestos = new Map(posiciones.map((fila) => [fila.mesero_id, fila]));

    return notificaciones.notificarA([...puestos.keys()], notificaciones.TIPO.RANKING,
        (meseroId) => {
            const { posicion, top6 } = puestos.get(meseroId);
            return `Se publicó el ranking del domingo: quedaste en el puesto #${posicion}` +
                (top6 === 1 ? ' (Top 6).' : '.');
        });
}

// Ranking, rachas y cierre ocurren en UNA sola transacción: si algo falla,
// no se guarda nada (el ranking solo se genera aquí, nunca por separado).
async function ejecutarCierre(domingoId) {
    await validarDomingoAbierto(domingoId);

    const ventas = await obtenerVentasParaCierre(domingoId);
    const posiciones = rankingService.calcularPosiciones(ventas);
    const { top6, resto } = rankingService.separarTop6(posiciones);

    await rankingService.guardarRanking(domingoId, posiciones);
    await rachaService.actualizarRachas(top6, resto);
    await repo.marcarCerrado(domingoId, new Date().toISOString());
    await avisarPuestos(posiciones);

    return top6;
}

function cerrarCorte(domingoId) {
    return repo.enTransaccion(() => ejecutarCierre(domingoId));
}

module.exports = { registrar, listar, obtenerPorId, cerrarCorte };
