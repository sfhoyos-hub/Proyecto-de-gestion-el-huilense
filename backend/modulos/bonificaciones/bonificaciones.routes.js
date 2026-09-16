const express = require('express');
const router = express.Router();

const { getDB } = require('../../database/initDB');


// Valida formato de fecha YYYY-MM-DD
function esFechaValida(fecha) {
    return typeof fecha === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}


// GET /bonificaciones?fecha=YYYY-MM-DD
// Consulta las bonificaciones correspondientes a un domingo
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

        // Verificar formato de fecha
        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        // Obtener los 6 meseros con mayores ventas
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

        // Agregar posición y bonificación
        const bonificaciones = top6.map((mesero, index) => ({
            posicion: index + 1,
            id: mesero.id,
            nombre: mesero.nombre,
            apellido: mesero.apellido,
            identificacion: mesero.identificacion,
            total_vendido: mesero.total_vendido,
            bonificacion: 10000
        }));

        // Calcular total de dinero destinado a bonificaciones
        const totalBonificaciones = bonificaciones.reduce(
            (total, mesero) => total + mesero.bonificacion,
            0
        );

        return res.status(200).json({
            fecha: fecha,
            cantidad_beneficiarios: bonificaciones.length,
            total_bonificaciones: totalBonificaciones,
            bonificaciones: bonificaciones
        });

    } catch (error) {
        console.error('Error en GET /bonificaciones:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar las bonificaciones.'
        });
    }
});


module.exports = router;