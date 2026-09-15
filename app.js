const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(express.json());
app.use(cors());

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db;

// Conectar a SQLite y crear la tabla con rol, contraseña y estado (RF-01)
async function initDB() {
    db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

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
    console.log('Base de datos SQLite conectada y lista para el Login.');
}

const dbReady = initDB();

// Endpoint de Login para cumplir con el Requerimiento Funcional RF-01
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
    }

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim()]);

        if (!user || user.password !== password) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        if (user.rol === 'MESERO' && user.estado === 'inactivo') {
            return res.status(403).json({ mensaje: 'La cuenta no está activa' });
        }

        res.json({
            mensaje: 'Login exitoso',
            usuario: {
                id: user.id,
                name: user.name,
                email: user.email,
                rol: user.rol,
                estado: user.estado
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al procesar el login', error: error.message });
    }
});

dbReady.then(() => {
    app.listen(3000, () => {
        console.log('El servidor está escuchando en el puerto 3000');
    });
}).catch((error) => {
    console.error('No se pudo inicializar la base de datos:', error.message);
    process.exit(1);
});