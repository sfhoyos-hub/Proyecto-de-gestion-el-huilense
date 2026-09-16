const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db;

async function initDB() {
    db = await open({
        filename: path.join(__dirname, '..', 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON');

    // =========================
    // USUARIOS
    // =========================
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'MESERO')),
            estado TEXT NOT NULL DEFAULT 'activo'
        )
    `);

    // =========================
    // MESEROS
    // =========================
    await db.exec(`
        CREATE TABLE IF NOT EXISTS meseros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            identificacion TEXT NOT NULL UNIQUE,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            fecha_ingreso TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'activo',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // =========================
    // TEMPORADAS
    // =========================
    await db.exec(`
        CREATE TABLE IF NOT EXISTS temporadas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE
        )
    `);

    // =========================
    // DOMINGOS
    // =========================
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

    // =========================
    // CONVOCATORIAS
    // =========================
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

    // =========================
    // VENTAS
    // =========================
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

    // =========================
    // RANKINGS
    // =========================
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

    // =========================
    // RACHAS
    // =========================
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

    // =========================
    // BONIFICACIONES
    // =========================
    await db.exec(`
        CREATE TABLE IF NOT EXISTS bonificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ranking_id INTEGER NOT NULL UNIQUE,
            monto REAL NOT NULL,
            fecha_entrega TEXT NOT NULL,
            observaciones TEXT,
            FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE
        )
    `);

    // =========================
    // CUENTAS NEQUI
    // =========================
    await db.exec(`
        CREATE TABLE IF NOT EXISTS cuentas_nequi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mesero_id INTEGER NOT NULL UNIQUE,
            numero_celular TEXT NOT NULL,
            FOREIGN KEY (mesero_id) REFERENCES meseros(id) ON DELETE CASCADE
        )
    `);

    // =========================
    // SOLICITUDES DE PAGO
    // =========================
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

    // =========================
    // NOTIFICACIONES
    // =========================
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

    // =========================
    // SUGERENCIAS
    // =========================
    await db.exec(`
        CREATE TABLE IF NOT EXISTS sugerencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contenido TEXT NOT NULL,
            fecha TEXT NOT NULL
        )
    `);

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