const express = require('express');
const router = express.Router();

// Ruta corregida apuntando a la carpeta database
const { getDB } = require('../../database/initDB');

// Consultar la racha de un mesero (GET)
router.get('/:mesero_id', async (req, res) => {
    const { mesero_id } = req.params;

    try {
        const db = getDB();
        const racha = await db.get('SELECT * FROM rachas WHERE mesero_id = ?', [mesero_id]);

        if (!racha) {
            return res.status(404).json({ mensaje: 'No se encontró información de rachas para este mesero' });
        }

        res.status(200).json(racha);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
});

// Crear o actualizar la racha de un mesero (POST)
router.post('/', async (req, res) => {
    const { mesero_id, racha_actual, activa } = req.body;

    if (!mesero_id) {
        return res.status(400).json({ mensaje: 'El mesero_id es obligatorio' });
    }

    try {
        const db = getDB();
        const fecha_actual = new Date().toISOString();

        await db.run(`
            INSERT INTO rachas (mesero_id, racha_actual, activa, fecha_ultima_actualizacion)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(mesero_id) DO UPDATE SET 
                racha_actual = excluded.racha_actual,
                activa = excluded.activa,
                fecha_ultima_actualizacion = excluded.fecha_ultima_actualizacion
        `, [mesero_id, racha_actual || 0, activa !== undefined ? activa : 0, fecha_actual]);

        res.status(200).json({ mensaje: 'Racha registrada/actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
});

module.exports = router;