const express = require('express');
const router = express.Router();
const { getDB } = require('../../database/initDB');

// Importar la lógica de negocio de las rachas
const { actualizarRachasAutomatica } = require('../racha/racha.service');

// Valida formato de fecha YYYY-MM-DD
function esFechaValida(fecha) {
    return typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

// POST /domingos - Registra un nuevo domingo
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { fecha, temporada_id, meseros_requeridos } = req.body;

        if (!fecha || meseros_requeridos === undefined) {
            return res.status(400).json({
                mensaje: 'Todos los campos son requeridos: fecha, meseros_requeridos.'
            });
        }

        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        const cantidad = Number(meseros_requeridos);

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            return res.status(400).json({
                mensaje: 'meseros_requeridos debe ser un número entero mayor a 0.'
            });
        }

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

        const domingoExistente = await db.get(
            'SELECT id FROM domingos WHERE fecha = ?',
            [fecha]
        );

        if (domingoExistente) {
            return res.status(409).json({
                mensaje: 'Ya existe un domingo registrado con esa fecha.'
            });
        }

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

// GET /domingos - Lista todos los domingos
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

// GET /domingos/:id - Consulta un domingo puntual
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

// ==========================================================
// NUEVA RUTA: POST /domingos/:id/cerrar-corte (RF-03, RF-06, RF-19)
// ==========================================================
router.post('/:id/cerrar-corte', async (req, res) => {
    const domingo_id = req.params.id;
    const db = getDB();

    try {
        const domingo = await db.get('SELECT cerrado FROM domingos WHERE id = ?', [domingo_id]);
        
        if (!domingo) {
            return res.status(404).json({ mensaje: 'El domingo indicado no existe.' });
        }
        if (domingo.cerrado === 1) {
            return res.status(400).json({ mensaje: 'Este domingo ya se encuentra cerrado.' });
        }

        // INICIO DE LA TRANSACCIÓN ACID (QAW Escenario #3)
        await db.run('BEGIN TRANSACTION'); 

        const fechaActual = new Date().toISOString();
        await db.run(
            `UPDATE domingos SET cerrado = 1, fecha_cierre = ? WHERE id = ?`, 
            [fechaActual, domingo_id]
        );

        const ventasRanking = await db.all(`
            SELECT mesero_id, total_vendido 
            FROM ventas 
            WHERE domingo_id = ? 
            ORDER BY total_vendido DESC
        `, [domingo_id]);

        if (ventasRanking.length === 0) {
            throw new Error("No se puede cerrar el corte: no hay ventas registradas para este domingo.");
        }

        const meserosTop6 = [];
        const meserosResto = [];

        for (let i = 0; i < ventasRanking.length; i++) {
            const posicion = i + 1;
            const esTop6 = posicion <= 6 ? 1 : 0;
            const mesero_id = ventasRanking[i].mesero_id;
            const total = ventasRanking[i].total_vendido;

            await db.run(`
                INSERT INTO rankings (domingo_id, mesero_id, posicion, total_vendido, top6)
                VALUES (?, ?, ?, ?, ?)
            `, [domingo_id, mesero_id, posicion, total, esTop6]);

            if (esTop6) {
                meserosTop6.push(mesero_id);
            } else {
                meserosResto.push(mesero_id);
            }
        }

        await actualizarRachasAutomatica(meserosTop6, meserosResto, db);

        // CONFIRMAR TRANSACCIÓN ACID
        await db.run('COMMIT');

        return res.status(200).json({ 
            mensaje: 'Corte dominical cerrado, ranking calculado y rachas actualizadas exitosamente.',
            top6: meserosTop6
        });

    } catch (error) {
        // REVERTIR CAMBIOS SI HAY ERROR (ACID)
        await db.run('ROLLBACK');
        console.error('Error al cerrar el corte:', error);
        return res.status(500).json({ mensaje: 'Error al cerrar el corte', error: error.message });
    }
});

module.exports = router;