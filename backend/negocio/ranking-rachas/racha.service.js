// Reglas de negocio de rachas (RF-15, RF-19). Sin req/res y sin SQL.
const { puerto } = require('../../dominio/puertos/registro');
const repo = puerto('repositorio.racha');
const { AppError } = require('../../utils/errores');

// Actualiza la racha de UN mesero según haya quedado o no en el Top 6.
function actualizarRacha(meseroId, esTop6, fecha) {
    return repo.registrarResultado(meseroId, esTop6 ? 1 : 0, fecha);
}

// Se llama al cerrar el corte, dentro de la misma transacción del ranking.
async function actualizarRachas(meserosTop6, meserosResto) {
    const fecha = new Date().toISOString();

    for (const meseroId of meserosTop6) {
        await actualizarRacha(meseroId, true, fecha);
    }

    for (const meseroId of meserosResto) {
        await actualizarRacha(meseroId, false, fecha);
    }
}

function verificarPermisoDeRacha(meseroId, usuario) {
    if (usuario.rol === 'MESERO' && Number(usuario.mesero_id) !== Number(meseroId)) {
        throw new AppError(403, 'Solo puedes consultar tu propia racha');
    }
}

async function consultarRacha(meseroId, usuario) {
    verificarPermisoDeRacha(meseroId, usuario);

    const racha = await repo.buscarPorMesero(meseroId);

    // Un mesero nuevo sin racha devuelve 0 en lugar de 404.
    return racha || { mesero_id: meseroId, racha_actual: 0, activa: 0 };
}

module.exports = { actualizarRacha, actualizarRachas, consultarRacha };
