// modulos/racha/racha.service.js
const { getDB } = require('../../database/initDB');

// Esta función es llamada por el módulo de "Domingos" al cerrar el corte (RF-19)
async function actualizarRachasAutomatica(meserosTop6, meserosResto, db) {
    const fecha_actual = new Date().toISOString();

    // 1. Incrementar racha para los del Top 6
    for (const mesero_id of meserosTop6) {
        await db.run(`
            INSERT INTO rachas (mesero_id, racha_actual, activa, fecha_ultima_actualizacion)
            VALUES (?, 1, 1, ?)
            ON CONFLICT(mesero_id) DO UPDATE SET 
                racha_actual = racha_actual + 1,
                activa = 1,
                fecha_ultima_actualizacion = excluded.fecha_ultima_actualizacion
        `, [mesero_id, fecha_actual]);
    }

    // 2. Reiniciar e inactivar racha para los que quedaron fuera del Top 6 (Puesto 7 en adelante)
    for (const mesero_id of meserosResto) {
        await db.run(`
            INSERT INTO rachas (mesero_id, racha_actual, activa, fecha_ultima_actualizacion)
            VALUES (?, 0, 0, ?)
            ON CONFLICT(mesero_id) DO UPDATE SET 
                racha_actual = 0,
                activa = 0,
                fecha_ultima_actualizacion = excluded.fecha_ultima_actualizacion
        `, [mesero_id, fecha_actual]);
    }
}

module.exports = { actualizarRachasAutomatica };