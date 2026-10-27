
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../../database/initDB');

const router = express.Router();

const SALT_ROUNDS = 12;

function esHashBcrypt(password) {
    return /^\$2[aby]\$\d{2}\$/.test(password);
}

router.post('/', async (req, res) => {
    const { email, password } = req.body || {};

    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({
            mensaje: 'Correo electrónico y contraseña son obligatorios'
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('Falta configurar JWT_SECRET en el archivo .env');

        return res.status(500).json({
            mensaje: 'La autenticación no está configurada'
        });
    }

    try {
        const db = getDB();
        const correo = email.trim().toLowerCase();

        const usuario = await db.get(
            `SELECT id, name, email, password, rol, estado
             FROM users
             WHERE email = ?`,
            [correo]
        );

        // Mensaje genérico para no revelar si un correo existe.
        if (!usuario) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        let passwordValida = false;
        let passwordAntigua = false;

        if (esHashBcrypt(usuario.password)) {
            passwordValida = await bcrypt.compare(
                password,
                usuario.password
            );
        } else {
            // Compatibilidad temporal con contraseñas antiguas.
            passwordValida = password === usuario.password;
            passwordAntigua = passwordValida;
        }

        if (!passwordValida) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        if (usuario.estado !== 'activo') {
            return res.status(403).json({
                mensaje: 'La cuenta se encuentra inactiva'
            });
        }

        let mesero = null;

        if (usuario.rol === 'MESERO') {
            mesero = await db.get(
                `SELECT id, estado
                 FROM meseros
                 WHERE user_id = ?`,
                [usuario.id]
            );

            if (!mesero || mesero.estado === 'inactivo') {
                return res.status(403).json({
                    mensaje: 'La cuenta se encuentra inactiva'
                });
            }
        }

        // Convertir contraseñas antiguas a bcrypt tras
        // comprobar que la contraseña ingresada es correcta.
        if (passwordAntigua) {
            const passwordHash = await bcrypt.hash(
                password,
                SALT_ROUNDS
            );

            await db.run(
                `UPDATE users
                 SET password = ?
                 WHERE id = ? AND password = ?`,
                [passwordHash, usuario.id, usuario.password]
            );
        }

        const token = jwt.sign(
            { sub: String(usuario.id) },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
        );

        return res.status(200).json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id,
                name: usuario.name,
                email: usuario.email,
                rol: usuario.rol,
                estado: usuario.estado,
                ...(mesero
                    ? {
                        mesero_id: mesero.id,
                        estado_mesero: mesero.estado
                    }
                    : {})
            }
        });
    } catch (error) {
        console.error('Error durante el login:', error);

        return res.status(500).json({
            mensaje: 'Error interno durante el inicio de sesión'
        });
    }
});

module.exports = router;
