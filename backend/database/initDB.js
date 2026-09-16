// Conexión a la base de datos SQLite del proyecto "El Huilense"
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
// Variable que guardará la conexión activa a la base de datos
let db;

// Conecta a SQLite y crea las tablas si no existen todavía.
// Se llama una sola vez, al arrancar el servidor (desde server.js).
async function initDB() {
    db = await open({
        filename: path.join(__dirname, '..', 'database.sqlite'), // el archivo vive en la raíz de backend/
        driver: sqlite3.Database
    });

    // Habilita las llaves foráneas (SQLite las trae desactivadas por defecto)
    await db.exec('PRAGMA foreign_keys = ON');

    // ---- Tabla: meseros ----
    // Guarda la información de cada mesero del restaurante
    await db.exec(`
        CREATE TABLE IF NOT EXISTS meseros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identificacion TEXT NOT NULL UNIQUE,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            fecha_ingreso TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'activo'
        )
    `);

    // ---- Tabla: ventas (HU 02.1 - Registro de Ventas) ----
    // Guarda el total vendido por cada mesero, cada domingo
    await db.exec(`
        CREATE TABLE IF NOT EXISTS ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mesero_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            total_vendido REAL NOT NULL,
            FOREIGN KEY (mesero_id) REFERENCES meseros(id) ON DELETE CASCADE,
            UNIQUE (mesero_id, fecha)
        )
    `);
    // El UNIQUE (mesero_id, fecha) es clave: evita que un mesero tenga
    // dos ventas registradas el mismo domingo (así se cumple la regla
    // de "editar si ya existe" en vez de duplicar).

        // ---- Tabla: users (RF-01 - Login) ----
    // Guarda los usuarios que pueden ingresar al sistema
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            rol TEXT NOT NULL,
            estado TEXT DEFAULT 'activo'
        )
    `);
    console.log('Base de datos SQLite conectada y tablas verificadas.');
   
    // Crear un usuario de prueba para el login
   await db.run(`
     INSERT OR IGNORE INTO users (id, name, email, password, rol, estado) 
     VALUES (1, 'David', 'david@huilense.com', '12345', 'admin', 'activo')
   `);
   return db;
}

// Devuelve la conexión ya abierta, para que las rutas puedan hacer consultas.
// Lanza un error si alguien intenta usarla antes de llamar a initDB().
function getDB() {
    if (!db) {
        throw new Error('La base de datos aún no ha sido inicializada. Llama a initDB() primero.');
    }
    return db;
}

module.exports = { initDB, getDB };