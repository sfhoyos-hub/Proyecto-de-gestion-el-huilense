const express = require('express');
const router = express.Router();

// Ruta corregida apuntando a la carpeta database
const { getDB } = require('../../database/initDB'); 

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            mensaje: 'Todos los campos son requeridos: email y password' 
        });
    }

    try {
        const db = getDB();
        const usuario = await db.get(
            'SELECT id, name, email, rol, estado FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        if (!usuario) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        if (usuario.estado !== 'activo') {
            return res.status(403).json({ mensaje: 'El usuario se encuentra inactivo' });
        }

        res.status(200).json({
            mensaje: 'Login exitoso',
            usuario: usuario
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
});

module.exports = router;