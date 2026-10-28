const express = require('express');
const router = express.Router();
const { getDB } = require('../../database/initDB'); // Ajusta la ruta si es necesario
const { requireAuth } = require('../../middleware/auth.middleware');

router.use(requireAuth);

// Consultar la racha de un mesero (GET) - RF-15
router.get('/:mesero_id', async (req, res) => {
    const { mesero_id } = req.params;

    // El MESERO solo puede consultar su propia racha
    if (req.user.rol === 'MESERO' && Number(req.user.mesero_id) !== Number(mesero_id)) {
        return res.status(403).json({ mensaje: 'Solo puedes consultar tu propia racha' });
    }

    try {
        const db = getDB();
        const racha = await db.get('SELECT * FROM rachas WHERE mesero_id = ?', [mesero_id]);

        if (!racha) {
            // Si es un mesero nuevo sin racha, devolvemos 0 en lugar de error 404
            return res.status(200).json({ mesero_id, racha_actual: 0, activa: 0 });
        }

        res.status(200).json(racha);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
});

module.exports = router;