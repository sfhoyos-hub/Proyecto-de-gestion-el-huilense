// Rutas de domingos - RF-03 / RF-09 / RF-10
// El admin registra cada domingo (fecha, temporada, meseros requeridos).
//
// POST /domingos       -> registra un nuevo domingo
// GET /domingos        -> lista todos los domingos
// GET /domingos/:id    -> consulta un domingo puntual

const express = require('express');
const router = express.Router();
const { getDB } = require('../../database/initDB');

// Valida formato de fecha YYYY-MM-DD
function esFechaValida(fecha) {
    return typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

// POST /domingos
// Registra un nuevo domingo
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { fecha, temporada_id, meseros_requeridos } = req.body;

        // Campos requeridos
        if (!fecha || meseros_requeridos === undefined) {
            return res.status(400).json({
                mensaje: 'Todos los campos son requeridos: fecha, meseros_requeridos.'
            });
        }

        // Formato de fecha
        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        // meseros_requeridos debe ser un entero positivo
        const cantidad = Number(meseros_requeridos);

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            return res.status(400).json({
                mensaje: 'meseros_requeridos debe ser un número entero mayor a 0.'
            });
        }

        // Si mandan temporada_id, debe existir
        if (temporada_id !== undefined && temporada_id !== null) {
            const temporada = await db.get(
                'SELECT id FROM temporadas WHERE id = ?',
                [temporada_id]
            );

            if (!temporada) {
                return res.status(404).json({
                    mensaje: 'La temporada indicada no existe.'
                });
            }
        }

        // No debe existir ya un domingo con esa fecha
        const domingoExistente = await db.get(
            'SELECT id FROM domingos WHERE fecha = ?',
            [fecha]
        );

        if (domingoExistente) {
            return res.status(409).json({
                mensaje: 'Ya existe un domingo registrado con esa fecha.'
            });
        }

        // Insertar nuevo domingo
        const resultado = await db.run(
            `INSERT INTO domingos (fecha, temporada_id, meseros_requeridos)
             VALUES (?, ?, ?)`,
            [fecha, temporada_id || null, cantidad]
        );

        const domingoGuardado = await db.get(
            'SELECT * FROM domingos WHERE id = ?',
            [resultado.lastID]
        );

        return res.status(201).json({
            mensaje: 'Domingo registrado correctamente.',
            domingo: domingoGuardado
        });

    } catch (error) {
        console.error('Error en POST /domingos:', error);

        return res.status(500).json({
            mensaje: 'Error interno al registrar el domingo.'
        });
    }
});

// GET /domingos
// Lista todos los domingos
router.get('/', async (req, res) => {
    try {
        const db = getDB();

        const domingos = await db.all(`
            SELECT d.id,
                   d.fecha,
                   d.temporada_id,
                   t.nombre AS temporada,
                   d.meseros_requeridos,
                   d.cerrado,
                   d.fecha_cierre
            FROM domingos d
            LEFT JOIN temporadas t ON t.id = d.temporada_id
            ORDER BY d.fecha DESC
        `);

        return res.status(200).json(domingos);

    } catch (error) {
        console.error('Error en GET /domingos:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar los domingos.'
        });
    }
});

// GET /domingos/:id
// Consulta un domingo puntual
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const domingo = await db.get(
            'SELECT * FROM domingos WHERE id = ?',
            [id]
        );

        if (!domingo) {
            return res.status(404).json({
                mensaje: 'El domingo indicado no existe.'
            });
        }

        return res.status(200).json(domingo);

    } catch (error) {
        console.error('Error en GET /domingos/:id:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar el domingo.'
        });
    }
});

module.exports = router;