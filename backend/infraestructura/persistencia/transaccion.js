const { getDB } = require('./initDB');

async function revertir(db) {
    try {
        await db.exec('ROLLBACK');
    } catch (errorRollback) {
        console.error('Error al revertir la transacción:', errorRollback);
    }
}

// Ejecuta fn dentro de una transacción: COMMIT si todo sale bien y
// ROLLBACK (solo si el BEGIN se ejecutó) si algo falla.
async function ejecutar(db, fn) {
    await db.exec('BEGIN IMMEDIATE');

    try {
        const resultado = await fn();
        await db.exec('COMMIT');
        return resultado;
    } catch (error) {
        await revertir(db);
        throw error;
    }
}

// SQLite usa UNA sola conexión: las transacciones deben ejecutarse una detrás
// de otra. Sin esta cola, dos peticiones simultáneas intentan abrir un BEGIN
// sobre la misma conexión y una de ellas falla con error 500.
let cola = Promise.resolve();

function conTransaccion(db, fn) {
    const turno = cola.then(() => ejecutar(db, fn));
    cola = turno.catch(() => {});
    return turno;
}

// Atajo para los repositories: usa la conexión global.
function enTransaccion(fn) {
    return conTransaccion(getDB(), fn);
}

module.exports = { conTransaccion, enTransaccion };
