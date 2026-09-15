const express = require('express');
const { getDB } = require('../../database/initDB');

const router = express.Router();

// GET /meseros -> lista todos los meseros
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const meseros = await db.all('SELECT * FROM meseros');

        res.json(meseros);
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al obtener meseros',
            error: error.message
        });
    }
});

// POST /meseros -> crea un mesero
router.post('/', async (req, res) => {
    const {
        identificacion,
        nombre,
        apellido,
        fecha_ingreso,
        estado
    } = req.body;

    if (!identificacion || !nombre || !apellido || !fecha_ingreso) {
        return res.status(400).json({
            mensaje: 'Faltan datos: identificacion, nombre, apellido o fecha_ingreso'
        });
    }

    try {
        const db = getDB();

        const resultado = await db.run(
            `INSERT INTO meseros 
            (identificacion, nombre, apellido, fecha_ingreso, estado)
            VALUES (?, ?, ?, ?, ?)`,
            [
                identificacion,
                nombre,
                apellido,
                fecha_ingreso,
                estado || 'activo'
            ]
        );

        res.status(201).json({
            mensaje: 'Mesero creado correctamente',
            mesero: {
                id: resultado.lastID,
                identificacion,
                nombre,
                apellido,
                fecha_ingreso,
                estado: estado || 'activo'
            }
        });

    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({
                mensaje: 'Ya existe un mesero con esa identificación'
            });
        }

        res.status(500).json({
            mensaje: 'Error al crear mesero',
            error: error.message
        });
    }
});

// PUT /meseros/:id -> modifica un mesero existente
router.put('/:id', async (req, res) => {
    const { id } = req.params;

    const {
        identificacion,
        nombre,
        apellido,
        fecha_ingreso,
        estado
    } = req.body;

    if (!identificacion || !nombre || !apellido || !fecha_ingreso) {
        return res.status(400).json({
            mensaje: 'Faltan datos: identificacion, nombre, apellido o fecha_ingreso'
        });
    }

    try {
        const db = getDB();

        // Verificar que el mesero exista
        const mesero = await db.get(
            'SELECT * FROM meseros WHERE id = ?',
            [id]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'El mesero no existe.'
            });
        }

        // Verificar que la identificación no pertenezca a otro mesero
        const identificacionExistente = await db.get(
            'SELECT * FROM meseros WHERE identificacion = ? AND id != ?',
            [identificacion, id]
        );

        if (identificacionExistente) {
            return res.status(400).json({
                mensaje: 'Ya existe otro mesero con esa identificación.'
            });
        }

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
                estado || mesero.estado,
                id
            ]
        );

        res.json({
            mensaje: 'Mesero actualizado correctamente.',
            mesero: {
                id,
                identificacion,
                nombre,
                apellido,
                fecha_ingreso,
                estado: estado || mesero.estado
            }
        });

    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al actualizar mesero',
            error: error.message
        });
    }
});

module.exports = router;