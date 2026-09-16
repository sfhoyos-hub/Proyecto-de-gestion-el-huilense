// Rutas de ranking - HU 02.2 / RF-03
// El ranking se genera por cada domingo según las ventas.

const express = require('express');
const router = express.Router();

const { getDB } = require('../../database/initDB');


// ============================================
// Validar formato YYYY-MM-DD
// ============================================
function esFechaValida(fecha) {
    return typeof fecha === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}


// ============================================
// GET /ranking?fecha=YYYY-MM-DD
// Consulta el ranking de un domingo
// ============================================
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const { fecha } = req.query;

        if (!fecha) {
            return res.status(400).json({
                mensaje: 'La fecha es requerida. Use el formato YYYY-MM-DD.'
            });
        }

        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        
        const ranking = await db.all(
            `SELECT
                r.id,
                r.posicion,
                m.id AS mesero_id,
                m.nombre,
                m.apellido,
                m.identificacion,
                r.total_vendido,
                r.top6
             FROM rankings r
             JOIN domingos d ON d.id = r.domingo_id
             JOIN meseros m ON m.id = r.mesero_id
             WHERE d.fecha = ?
             ORDER BY r.posicion ASC`,
            [fecha]
        );

        return res.status(200).json({
            fecha,
            cantidad: ranking.length,
            ranking
        });

    } catch (error) {
        console.error('Error en GET /ranking:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar el ranking.'
        });
    }
});


// ============================================
// GET /ranking/top6?fecha=YYYY-MM-DD
// Consulta los seis primeros
// ============================================
router.get('/top6', async (req, res) => {
    try {
        const db = getDB();
        const { fecha } = req.query;

        if (!fecha) {
            return res.status(400).json({
                mensaje: 'La fecha es requerida. Use el formato YYYY-MM-DD.'
            });
        }

        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        const top6 = await db.all(
            `SELECT
                r.id,
                r.posicion,
                m.id AS mesero_id,
                m.nombre,
                m.apellido,
                m.identificacion,
                r.total_vendido,
                r.top6
             FROM rankings r
             JOIN domingos d ON d.id = r.domingo_id
             JOIN meseros m ON m.id = r.mesero_id
             WHERE d.fecha = ?
               AND r.top6 = 1
             ORDER BY r.posicion ASC`,
            [fecha]
        );

        return res.status(200).json({
            fecha,
            cantidad: top6.length,
            top6
        });

    } catch (error) {
        console.error('Error en GET /ranking/top6:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar el Top 6.'
        });
    }
});


// ============================================
// POST /ranking/generar
// Genera el ranking de un domingo
// ============================================
router.post('/generar', async (req, res) => {
    try {
        const db = getDB();
        const { fecha } = req.body;

        if (!fecha) {
            return res.status(400).json({
                mensaje: 'La fecha es requerida.'
            });
        }

        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        // Buscar el domingo
        const domingo = await db.get(
            `SELECT id, fecha, cerrado
             FROM domingos
             WHERE fecha = ?`,
            [fecha]
        );

        if (!domingo) {
            return res.status(404).json({
                mensaje: 'No existe un domingo registrado con esa fecha.'
            });
        }

        // Verificar que el domingo esté cerrado
        if (domingo.cerrado !== 1) {
            return res.status(400).json({
                mensaje: 'El domingo aún no está cerrado. No se puede generar el ranking.'
            });
        }

        // Obtener las ventas
        const ventas = await db.all(
            `SELECT
                mesero_id,
                total_vendido
             FROM ventas
             WHERE domingo_id = ?
             ORDER BY total_vendido DESC`,
            [domingo.id]
        );

        if (ventas.length === 0) {
            return res.status(400).json({
                mensaje: 'No existen ventas registradas para ese domingo.'
            });
        }

        // Evitar generar dos veces el mismo ranking
        const rankingExistente = await db.get(
            `SELECT id
             FROM rankings
             WHERE domingo_id = ?
             LIMIT 1`,
            [domingo.id]
        );

        if (rankingExistente) {
            return res.status(409).json({
                mensaje: 'El ranking de este domingo ya fue generado.'
            });
        }

        // Generar ranking
        for (let i = 0; i < ventas.length; i++) {

            const posicion = i + 1;
            const top6 = posicion <= 6 ? 1 : 0;

            await db.run(
                `INSERT INTO rankings (
                    domingo_id,
                    mesero_id,
                    posicion,
                    total_vendido,
                    top6
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    domingo.id,
                    ventas[i].mesero_id,
                    posicion,
                    ventas[i].total_vendido,
                    top6
                ]
            );
        }

        // Obtener ranking generado
        const rankingGenerado = await db.all(
            `SELECT
                r.id,
                r.posicion,
                m.id AS mesero_id,
                m.nombre,
                m.apellido,
                m.identificacion,
                r.total_vendido,
                r.top6
             FROM rankings r
             JOIN meseros m ON m.id = r.mesero_id
             WHERE r.domingo_id = ?
             ORDER BY r.posicion ASC`,
            [domingo.id]
        );

        return res.status(201).json({
            mensaje: 'Ranking generado correctamente.',
            fecha,
            ranking: rankingGenerado
        });

    } catch (error) {
        console.error('Error en POST /ranking/generar:', error);

        return res.status(500).json({
            mensaje: 'Error interno al generar el ranking.'
        });
    }
});


module.exports = router;
