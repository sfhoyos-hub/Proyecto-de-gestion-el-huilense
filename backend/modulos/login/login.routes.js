const express = require('express');
const { getDB } = require('../../database/initDB');

const router = express.Router();

// POST /login
// Permite iniciar sesión con correo y contraseña
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    // Validar que se hayan enviado los campos
    if (!email || !password) {
        return res.status(400).json({
            mensaje: 'Todos los campos son requeridos'
        });
    }

    try {
        const db = getDB();

        // Buscar el usuario por su correo
        const user = await db.get(
            'SELECT * FROM users WHERE email = ?',
            [email.trim()]
        );

        // Verificar que exista y que la contraseña coincida
        if (!user || user.password !== password) {
            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        // Un mesero inactivo no puede iniciar sesión
        if (user.rol === 'MESERO' && user.estado === 'inactivo') {
            return res.status(403).json({
                mensaje: 'La cuenta no está activa'
            });
        }

        // Login correcto
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
        res.status(500).json({
            mensaje: 'Error al procesar el login',
            error: error.message
        });
    }
});

module.exports = router;