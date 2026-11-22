// Solo SQL.
const { getDB } = require('../initDB');
const { crearRepositorio } = require('./base');

function buscarPorMesero(meseroId) {
    return getDB().get('SELECT * FROM rachas WHERE mesero_id = ?', [meseroId]);
}

// Un solo UPSERT para ambos casos:
//  - esTop6 = 1: crea la racha en 1 o la incrementa y la activa.
//  - esTop6 = 0: crea la racha en 0 o la reinicia e inactiva.
function registrarResultado(meseroId, esTop6, fecha) {
    return getDB().run(
        `INSERT INTO rachas
            (mesero_id, racha_actual, activa, fecha_ultima_actualizacion)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(mesero_id) DO UPDATE SET
            racha_actual = CASE WHEN excluded.activa = 1
                                THEN racha_actual + 1 ELSE 0 END,
            activa = excluded.activa,
            fecha_ultima_actualizacion = excluded.fecha_ultima_actualizacion`,
        [meseroId, esTop6, esTop6, fecha]
    );
}

module.exports = crearRepositorio({ buscarPorMesero, registrarResultado });
