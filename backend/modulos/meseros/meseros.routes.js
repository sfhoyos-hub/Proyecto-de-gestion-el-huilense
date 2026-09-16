const express = require('express');
const { getDB } = require('../../database/initDB');

const router = express.Router();

// =====================================================
// POST /meseros
// Registrar un mesero
// =====================================================
router.post('/', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            identificacion,
            nombre,
            apellido,
            fecha_ingreso
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !identificacion ||
            !nombre ||
            !apellido ||
            !fecha_ingreso
        ) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });
        }

        const db = getDB();

        // Verificar si el correo ya existe
        const usuarioExistente = await db.get(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (usuarioExistente) {
            return res.status(409).json({
                mensaje: 'El correo electrónico ya está registrado'
            });
        }

        // Verificar si la identificación ya existe
        const identificacionExistente = await db.get(
            'SELECT id FROM meseros WHERE identificacion = ?',
            [identificacion]
        );

        if (identificacionExistente) {
            return res.status(409).json({
                mensaje: 'La identificación ya está registrada'
            });
        }

        // Crear usuario
        const usuario = await db.run(
            `INSERT INTO users
            (name, email, password, rol)
            VALUES (?, ?, ?, 'MESERO')`,
            [name, email, password]
        );

        // Crear mesero relacionado con el usuario
        const mesero = await db.run(
            `INSERT INTO meseros
            (user_id, identificacion, nombre, apellido, fecha_ingreso)
            VALUES (?, ?, ?, ?, ?)`,
            [
                usuario.lastID,
                identificacion,
                nombre,
                apellido,
                fecha_ingreso
            ]
        );

        return res.status(201).json({
            mensaje: 'Mesero registrado correctamente',
            mesero_id: mesero.lastID,
            user_id: usuario.lastID
        });

    } catch (error) {
        console.error('Error al registrar mesero:', error);

        return res.status(500).json({
            mensaje: 'Error al registrar el mesero',
            error: error.message
        });
    }
});


// =====================================================
// GET /meseros
// Obtener todos los meseros
// =====================================================
router.get('/', async (req, res) => {
    try {
        const db = getDB();

        const meseros = await db.all(`
            SELECT
                m.id,
                m.user_id,
                m.identificacion,
                m.nombre,
                m.apellido,
                m.fecha_ingreso,
                m.estado,
                u.email
            FROM meseros m
            INNER JOIN users u ON m.user_id = u.id
            ORDER BY m.id ASC
        `);

        return res.status(200).json(meseros);

    } catch (error) {
        console.error('Error al obtener meseros:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener los meseros',
            error: error.message
        });
    }
});


// =====================================================
// GET /meseros/:id
// Obtener un mesero por ID
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const mesero = await db.get(`
            SELECT
                m.id,
                m.user_id,
                m.identificacion,
                m.nombre,
                m.apellido,
                m.fecha_ingreso,
                m.estado,
                u.name,
                u.email,
                u.rol
            FROM meseros m
            INNER JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `, [id]);

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'Mesero no encontrado'
            });
        }

        return res.status(200).json(mesero);

    } catch (error) {
        console.error('Error al consultar mesero:', error);

        return res.status(500).json({
            mensaje: 'Error al consultar el mesero',
            error: error.message
        });
    }
});


// =====================================================
// PUT /meseros/:id
// Actualizar un mesero
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            email,
            password,
            identificacion,
            nombre,
            apellido,
            fecha_ingreso,
            estado
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !identificacion ||
            !nombre ||
            !apellido ||
            !fecha_ingreso ||
            !estado
        ) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });
        }

        const db = getDB();

        // Buscar mesero
        const mesero = await db.get(
            'SELECT user_id FROM meseros WHERE id = ?',
            [id]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'Mesero no encontrado'
            });
        }

        // Verificar correo de otro usuario
        const correoExistente = await db.get(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, mesero.user_id]
        );

        if (correoExistente) {
            return res.status(409).json({
                mensaje: 'El correo electrónico ya está registrado'
            });
        }

        // Verificar identificación de otro mesero
        const identificacionExistente = await db.get(
            'SELECT id FROM meseros WHERE identificacion = ? AND id != ?',
            [identificacion, id]
        );

        if (identificacionExistente) {
            return res.status(409).json({
                mensaje: 'La identificación ya está registrada'
            });
        }

        // Actualizar usuario
        await db.run(
            `UPDATE users
             SET name = ?, email = ?, password = ?
             WHERE id = ?`,
            [
                name,
                email,
                password,
                mesero.user_id
            ]
        );

        // Actualizar mesero
        await db.run(
            `UPDATE meseros
             SET identificacion = ?,
                 nombre = ?,
                 apellido = ?,
                 fecha_ingreso = ?,
                 estado = ?
             WHERE id = ?`,
            [
                identificacion,
                nombre,
                apellido,
                fecha_ingreso,
                estado,
                id
            ]
        );

        return res.status(200).json({
            mensaje: 'Mesero actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar mesero:', error);

        return res.status(500).json({
            mensaje: 'Error al actualizar el mesero',
            error: error.message
        });
    }
});


// =====================================================
// DELETE /meseros/:id
// Eliminar un mesero
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const mesero = await db.get(
            'SELECT user_id FROM meseros WHERE id = ?',
            [id]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'Mesero no encontrado'
            });
        }

        // Eliminar mesero
        await db.run(
            'DELETE FROM meseros WHERE id = ?',
            [id]
        );

        // Eliminar usuario relacionado
        await db.run(
            'DELETE FROM users WHERE id = ?',
            [mesero.user_id]
        );

        return res.status(200).json({
            mensaje: 'Mesero eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar mesero:', error);

        return res.status(500).json({
            mensaje: 'Error al eliminar el mesero',
            error: error.message
        });
    }
});


module.exports = router;