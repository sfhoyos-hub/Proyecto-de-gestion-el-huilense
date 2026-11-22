const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { migrar, COLUMNA_ESTADO_BONIFICACION } = require('./migraciones');

let db;

const RUTA_BD = path.join(__dirname, '..', '..', 'database.sqlite');

async function crearTablaUsuarios(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'MESERO')),
            estado TEXT NOT NULL DEFAULT 'ACTIVO'
                CHECK (estado IN ('ACTIVO', 'INACTIVO'))
        )
    `);
}

async function crearTablaMeseros(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS meseros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            identificacion TEXT NOT NULL UNIQUE,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            fecha_ingreso TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'ACTIVO'
                CHECK (estado IN ('ACTIVO', 'INACTIVO')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
}

async function crearTablaTemporadas(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS temporadas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE
        )
    `);
}

async function crearTablaDomingos(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS domingos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL UNIQUE,
            temporada_id INTEGER,
            meseros_requeridos INTEGER NOT NULL DEFAULT 0,
            cerrado INTEGER NOT NULL DEFAULT 0,
            cerrado_por INTEGER,
            fecha_cierre TEXT,
            FOREIGN KEY (temporada_id) REFERENCES temporadas(id),
            FOREIGN KEY (cerrado_por) REFERENCES users(id)
        )
    `);
}

async function crearTablaConvocatorias(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS convocatorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domingo_id INTEGER NOT NULL,
            mesero_id INTEGER NOT NULL,
            estado TEXT NOT NULL DEFAULT 'convocado'
                CHECK (estado IN ('convocado', 'descanso')),
            FOREIGN KEY (domingo_id) REFERENCES domingos(id) ON DELETE CASCADE,
            FOREIGN KEY (mesero_id) REFERENCES meseros(id) ON DELETE CASCADE,
            UNIQUE (domingo_id, mesero_id)
        )
    `);
}

async function crearTablaVentas(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mesero_id INTEGER NOT NULL,
            domingo_id INTEGER NOT NULL,
            total_vendido REAL NOT NULL,
            FOREIGN KEY (mesero_id) REFERENCES meseros(id) ON DELETE CASCADE,
            FOREIGN KEY (domingo_id) REFERENCES domingos(id) ON DELETE CASCADE,
            UNIQUE (mesero_id, domingo_id)
        )
    `);
}

async function crearTablaRankings(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domingo_id INTEGER NOT NULL,
            mesero_id INTEGER NOT NULL,
            posicion INTEGER NOT NULL,
            total_vendido REAL NOT NULL,
            top6 INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (domingo_id) REFERENCES domingos(id) ON DELETE CASCADE,
            FOREIGN KEY (mesero_id) REFERENCES meseros(id) ON DELETE CASCADE,
            UNIQUE (domingo_id, mesero_id)
        )
    `);
}

async function crearTablaRachas(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rachas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mesero_id INTEGER NOT NULL UNIQUE,
            racha_actual INTEGER NOT NULL DEFAULT 0,
            activa INTEGER NOT NULL DEFAULT 0,
            fecha_ultima_actualizacion TEXT,
            FOREIGN KEY (mesero_id) REFERENCES meseros(id) ON DELETE CASCADE
        )
    `);
}

async function crearTablaBonificaciones(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS bonificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ranking_id INTEGER NOT NULL UNIQUE,
            monto REAL NOT NULL,
            fecha_entrega TEXT NOT NULL,
            observaciones TEXT,
            ${COLUMNA_ESTADO_BONIFICACION},
            FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE
        )
    `);
}

async function crearTablaCuentasNequi(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS cuentas_nequi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mesero_id INTEGER NOT NULL UNIQUE,
            numero_celular TEXT NOT NULL,
            FOREIGN KEY (mesero_id) REFERENCES meseros(id) ON DELETE CASCADE
        )
    `);
}

async function crearTablaSolicitudesPago(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS solicitudes_pago (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bonificacion_id INTEGER NOT NULL UNIQUE,
            estado TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'confirmado', 'cancelado', 'error')),
            fecha_solicitud TEXT NOT NULL,
            fecha_confirmacion TEXT,
            mensaje_error TEXT,
            FOREIGN KEY (bonificacion_id)
                REFERENCES bonificaciones(id) ON DELETE CASCADE
        )
    `);
}

async function crearTablaNotificaciones(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS notificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mesero_id INTEGER NOT NULL,
            tipo TEXT NOT NULL
                CHECK (tipo IN ('turno', 'ranking', 'bonificacion', 'pago')),
            mensaje TEXT NOT NULL,
            fecha TEXT NOT NULL,
            leida INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (mesero_id) REFERENCES meseros(id) ON DELETE CASCADE
        )
    `);
}

async function crearTablaSugerencias(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS sugerencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contenido TEXT NOT NULL,
            fecha TEXT NOT NULL
        )
    `);
}

async function crearTablaAuditoria(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS auditoria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK (tipo IN
                ('ACCESO_DENEGADO', 'CAMBIO_MONTO', 'CAMBIO_CUENTA')),
            usuario_id INTEGER,
            rol TEXT,
            accion TEXT NOT NULL,
            entidad TEXT,
            entidad_id INTEGER,
            valor_anterior TEXT,
            valor_nuevo TEXT,
            detalle TEXT,
            ip TEXT
        )
    `);
}

// La auditoría es de solo escritura: nadie puede editar ni borrar registros.
async function protegerTablaAuditoria(db) {
    for (const operacion of ['UPDATE', 'DELETE']) {
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS auditoria_sin_${operacion.toLowerCase()}
            BEFORE ${operacion} ON auditoria
            BEGIN
                SELECT RAISE(ABORT, 'La auditoría es de solo escritura');
            END
        `);
    }
}

// Orden importante: las tablas referenciadas se crean primero.
async function crearTablas(db) {
    await crearTablaUsuarios(db);
    await crearTablaMeseros(db);
    await crearTablaTemporadas(db);
    await crearTablaDomingos(db);
    await crearTablaConvocatorias(db);
    await crearTablaVentas(db);
    await crearTablaRankings(db);
    await crearTablaRachas(db);
    await crearTablaBonificaciones(db);
    await crearTablaCuentasNequi(db);
    await crearTablaSolicitudesPago(db);
    await crearTablaNotificaciones(db);
    await crearTablaSugerencias(db);
    await crearTablaAuditoria(db);
    await protegerTablaAuditoria(db);
}

async function initDB() {
    db = await open({ filename: RUTA_BD, driver: sqlite3.Database });

    await db.exec('PRAGMA foreign_keys = ON');
    await crearTablas(db);
    await migrar(db);

    console.log('Base de datos SQLite conectada y tablas verificadas.');

    return db;
}

function getDB() {
    if (!db) {
        throw new Error(
            'La base de datos aún no ha sido inicializada. Llama a initDB() primero.'
        );
    }

    return db;
}

module.exports = { initDB, getDB };
