// Migraciones de esquema y de datos. Son idempotentes: se ejecutan en cada
// arranque y solo actúan cuando hace falta.
const { esHashBcrypt, hashearPassword } = require('../../utils/passwords');

const COLUMNA_ESTADO_BONIFICACION = `estado TEXT NOT NULL DEFAULT 'REGISTRADA'
                CHECK (estado IN ('REGISTRADA', 'PAGADA'))`;

async function columnaExiste(db, tabla, columna) {
    const columnas = await db.all(`PRAGMA table_info(${tabla})`);

    return columnas.some((c) => c.name === columna);
}

// Devuelve true solo si la columna no existía y fue agregada.
async function agregarColumnaSiNoExiste(db, tabla, columna, definicion) {
    if (await columnaExiste(db, tabla, columna)) {
        return false;
    }

    await db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);

    return true;
}

// Pasa el estado a mayúsculas y elimina 'descanso' (queda como ACTIVO).
function normalizarEstados(db, tabla) {
    return db.exec(`
        UPDATE ${tabla}
        SET estado = CASE WHEN LOWER(estado) = 'inactivo'
                          THEN 'INACTIVO' ELSE 'ACTIVO' END
    `);
}

async function migrarEstadosDeUsuarios(db) {
    await normalizarEstados(db, 'users');
    await normalizarEstados(db, 'meseros');
}

// Las bonificaciones con pago confirmado quedan como PAGADA.
async function migrarEstadoDeBonificaciones(db) {
    const agregada = await agregarColumnaSiNoExiste(
        db, 'bonificaciones', 'estado', COLUMNA_ESTADO_BONIFICACION
    );

    if (!agregada) {
        return;
    }

    await db.exec(`
        UPDATE bonificaciones SET estado = 'PAGADA'
        WHERE id IN (SELECT bonificacion_id FROM solicitudes_pago
                     WHERE estado = 'confirmado')
    `);
}

// Cifra las contraseñas que estuvieran guardadas en texto plano.
async function migrarPasswordsEnTextoPlano(db) {
    const usuarios = await db.all('SELECT id, password FROM users');
    const pendientes = usuarios.filter((u) => !esHashBcrypt(u.password));

    for (const usuario of pendientes) {
        const hash = await hashearPassword(usuario.password);

        await db.run('UPDATE users SET password = ? WHERE id = ?',
            [hash, usuario.id]);
    }

    if (pendientes.length > 0) {
        console.log(`${pendientes.length} contraseña(s) en texto plano fueron cifradas.`);
    }
}

// Guarda con qué criterio (rendimiento o antigüedad) se armó cada convocatoria.
function migrarEstrategiaDeConvocatorias(db) {
    return agregarColumnaSiNoExiste(db, 'convocatorias', 'estrategia', 'TEXT');
}

async function migrar(db) {
    await migrarEstadosDeUsuarios(db);
    await migrarEstadoDeBonificaciones(db);
    await migrarEstrategiaDeConvocatorias(db);
    await migrarPasswordsEnTextoPlano(db);
}

module.exports = { migrar, COLUMNA_ESTADO_BONIFICACION };
