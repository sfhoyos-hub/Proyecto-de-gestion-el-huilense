// Convocatoria «Strategy»: arma la lista de meseros de un domingo con la
// estrategia elegida por el administrador. Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const { Convocatoria } = require('../../dominio/convocatoria');
const Domingo = require('../../dominio/ventas/Domingo');
const Mesero = require('../../dominio/usuarios/Mesero');
const EstrategiaPorRendimiento = require('./estrategias/EstrategiaPorRendimiento');
const EstrategiaPorAntiguedad = require('./estrategias/EstrategiaPorAntiguedad');
const notificaciones = require('../notificaciones/GestorNotificaciones');
const { AppError } = require('../../utils/errores');
const { esIdValido } = require('../../utils/validaciones');

const repo = puerto('repositorio.convocatorias');

// Cuántos domingos cerrados anteriores cuentan para el rendimiento.
const DOMINGOS_RECIENTES = 4;

const ESTRATEGIAS = new Map(
    [new EstrategiaPorRendimiento(), new EstrategiaPorAntiguedad()]
        .map((estrategia) => [estrategia.nombre, estrategia])
);

// ---------- Validaciones ----------

function validarDomingoId(valor) {
    if (!esIdValido(valor)) {
        throw new AppError(400, 'domingo_id debe ser un entero positivo.');
    }

    return Number(valor);
}

function elegirEstrategia(nombre = 'rendimiento') {
    const estrategia = ESTRATEGIAS.get(nombre);

    if (!estrategia) {
        throw new AppError(400,
            `Estrategia inválida. Usa: ${[...ESTRATEGIAS.keys()].join(', ')}.`);
    }

    return estrategia;
}

async function obtenerDomingoAbierto(domingoId) {
    const fila = await repo.buscarDomingo(domingoId);

    if (!fila) {
        throw new AppError(404, 'El domingo indicado no existe.');
    }

    const domingo = Domingo.desdeFila(fila);

    if (domingo.estaCerrado()) {
        throw new AppError(409, 'El domingo ya está cerrado; no se puede convocar.');
    }

    return domingo;
}

// Si ya hay ventas, rehacer la convocatoria podría dejar por fuera a un
// mesero que ya vendió ese domingo.
async function verificarSinVentas(domingoId) {
    const { total } = await repo.contarVentasDelDomingo(domingoId);

    if (total > 0) {
        throw new AppError(409,
            'El domingo ya tiene ventas registradas; no se puede rehacer la convocatoria.');
    }
}

async function obtenerCandidatos(domingo) {
    const filas = await repo.listarMeserosActivosConRendimiento(
        domingo.fecha, DOMINGOS_RECIENTES
    );

    if (filas.length === 0) {
        throw new AppError(409, 'No hay meseros activos para convocar.');
    }

    return filas.map((fila) => ({
        mesero: Mesero.desdeFila(fila),
        totalReciente: fila.total_reciente
    }));
}

// ---------- Operaciones ----------

// Reemplaza la convocatoria anterior del domingo (si la había) y avisa a los convocados.
function guardar(convocatoria) {
    const domingo = convocatoria.domingo;

    return repo.enTransaccion(async () => {
        await repo.eliminarDelDomingo(domingo.id);

        for (const detalle of convocatoria.detalles) {
            await repo.insertar(domingo.id, detalle.mesero.meseroId, detalle.estado);
        }

        await notificaciones.notificarA(
            convocatoria.convocados().map((detalle) => detalle.mesero.meseroId),
            notificaciones.TIPO.TURNO,
            () => `Fuiste convocado para trabajar el domingo ${domingo.fecha}.`
        );
    });
}

async function generar(body = {}) {
    const domingoId = validarDomingoId(body.domingo_id);
    const estrategia = elegirEstrategia(body.estrategia);
    const domingo = await obtenerDomingoAbierto(domingoId);

    await verificarSinVentas(domingoId);

    const candidatos = await obtenerCandidatos(domingo);
    const convocatoria = Convocatoria.crear(
        domingo, estrategia.nombre, estrategia.ordenar(candidatos, domingo.fecha)
    );

    await guardar(convocatoria);

    return convocatoria;
}

async function consultar(domingoIdParam) {
    const domingoId = validarDomingoId(domingoIdParam);
    const fila = await repo.buscarDomingo(domingoId);

    if (!fila) {
        throw new AppError(404, 'El domingo indicado no existe.');
    }

    const filas = await repo.listarPorDomingo(domingoId);

    return {
        domingo_id: fila.id,
        fecha: fila.fecha,
        meseros_requeridos: fila.meseros_requeridos,
        convocados: filas.filter((f) => f.estado === 'convocado'),
        descanso: filas.filter((f) => f.estado === 'descanso')
    };
}

function misConvocatorias(usuario) {
    return repo.listarPorMesero(usuario.mesero_id);
}

module.exports = { generar, consultar, misConvocatorias, elegirEstrategia, ESTRATEGIAS };
