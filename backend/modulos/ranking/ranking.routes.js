// Rutas de ranking - HU 02.2 / RF-03
// El ranking se genera por cada domingo según las ventas
// de cada mesero.
//
// GET /ranking?fecha=YYYY-MM-DD
//     -> muestra el ranking de ese domingo
//
// GET /ranking/top6?fecha=YYYY-MM-DD
//     -> muestra los 6 meseros con mayores ventas

const express = require('express');
const router = express.Router();

const { getDB } = require('../../database/initDB');


// Valida formato de fecha YYYY-MM-DD
function esFechaValida(fecha) {
    return typeof fecha === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}


// GET /ranking
// Ranking completo de un domingo
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const { fecha } = req.query;

        // Verificar que se envió la fecha
        if (!fecha) {
            return res.status(400).json({
                mensaje: 'La fecha es requerida. Use el formato YYYY-MM-DD.'
            });
        }

        // Verificar formato
        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        // Buscar las ventas de ese domingo
        const ranking = await db.all(
            `SELECT
                m.id,
                m.nombre,
                m.apellido,
                m.identificacion,
                v.total_vendido
             FROM ventas v
             JOIN meseros m ON m.id = v.mesero_id
             WHERE v.fecha = ?
             ORDER BY v.total_vendido DESC`,
            [fecha]
        );

        // Agregar posición
        const rankingConPosicion = ranking.map((mesero, index) => ({
            posicion: index + 1,
            ...mesero
        }));

        return res.status(200).json({
            fecha: fecha,
            ranking: rankingConPosicion
        });

    } catch (error) {
        console.error('Error en GET /ranking:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar el ranking.'
        });
    }
});


// GET /ranking/top6
// Obtiene solamente los 6 primeros
router.get('/top6', async (req, res) => {
    try {
        const db = getDB();
        const { fecha } = req.query;

        // Verificar que se envió la fecha
        if (!fecha) {
            return res.status(400).json({
                mensaje: 'La fecha es requerida. Use el formato YYYY-MM-DD.'
            });
        }

        // Verificar formato
        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        // Obtener los 6 con mayores ventas
        const top6 = await db.all(
            `SELECT
                m.id,
                m.nombre,
                m.apellido,
                m.identificacion,
                v.total_vendido
             FROM ventas v
             JOIN meseros m ON m.id = v.mesero_id
             WHERE v.fecha = ?
             ORDER BY v.total_vendido DESC
             LIMIT 6`,
            [fecha]
        );

        // Agregar posición
        const top6ConPosicion = top6.map((mesero, index) => ({
            posicion: index + 1,
            ...mesero
        }));

        return res.status(200).json({
            fecha: fecha,
            cantidad: top6ConPosicion.length,
            top6: top6ConPosicion
        });

    } catch (error) {
        console.error('Error en GET /ranking/top6:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar el Top 6.'
        });
    }
});


module.exports = router;

