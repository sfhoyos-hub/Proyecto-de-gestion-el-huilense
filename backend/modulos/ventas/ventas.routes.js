// Rutas de ventas dominicales - HU 02.1 / RF-02
// El admin registra el total vendido por cada mesero cada domingo.
//
// POST /ventas       -> registra una nueva venta
// PUT /ventas/:id   -> edita una venta existente
// GET /ventas       -> consulta las ventas
// GET /ventas/mesero/:mesero_id -> historial de un mesero

const express = require('express');
const router = express.Router();
const { getDB } = require('../../database/initDB');

// Valida formato de fecha YYYY-MM-DD
function esFechaValida(fecha) {
    return typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}
// POST /ventas
// Registra una nueva venta
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { mesero_id, fecha, total_vendido } = req.body;

        // Campos requeridos
        if (mesero_id === undefined || !fecha || total_vendido === undefined) {
            return res.status(400).json({
                mensaje: 'Todos los campos son requeridos: mesero_id, fecha, total_vendido.'
            });
        }

        // Formato de fecha
        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        // Monto negativo o no numérico -> rechazado
        const monto = Number(total_vendido);

        if (Number.isNaN(monto) || monto < 0) {
            return res.status(400).json({
                mensaje: 'El monto vendido debe ser un valor numérico igual o mayor a 0.'
            });
        }

        // El mesero debe existir
        const mesero = await db.get(
            'SELECT * FROM meseros WHERE id = ?',
            [mesero_id]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'El mesero indicado no existe.'
            });
        }

        // Mesero inactivo -> no puede registrar venta
        if (mesero.estado !== 'activo') {
            return res.status(400).json({
                mensaje: 'El mesero está inactivo y no puede tener ventas registradas.'
            });
        }

        // Verificar si ya existe una venta para ese mesero y fecha
        const ventaExistente = await db.get(
            'SELECT * FROM ventas WHERE mesero_id = ? AND fecha = ?',
            [mesero_id, fecha]
        );

        if (ventaExistente) {
            return res.status(409).json({
                mensaje: 'Ya existe una venta para este mesero en esta fecha. Use PUT para editarla.'
            });
        }

        // Insertar nueva venta
        const resultado = await db.run(
            `INSERT INTO ventas (mesero_id, fecha, total_vendido)
             VALUES (?, ?, ?)`,
            [mesero_id, fecha, monto]
        );

        // Obtener la venta creada
        const ventaGuardada = await db.get(
            'SELECT * FROM ventas WHERE id = ?',
            [resultado.lastID]
        );

        return res.status(201).json({
            mensaje: 'Venta registrada correctamente.',
            venta: ventaGuardada
        });

    } catch (error) {
        console.error('Error en POST /ventas:', error);

        return res.status(500).json({
            mensaje: 'Error interno al registrar la venta.'
        });
    }
});
// Put /ventas/:id
// Editar una venta existente
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();

        const { id } = req.params;
        const { mesero_id, fecha, total_vendido } = req.body;

        // Campos requeridos
        if (mesero_id === undefined || !fecha || total_vendido === undefined) {
            return res.status(400).json({
                mensaje: 'Todos los campos son requeridos: mesero_id, fecha, total_vendido.'
            });
        }

        // Formato de fecha
        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
            });
        }

        // Monto negativo o no numérico -> rechazado
        const monto = Number(total_vendido);

        if (Number.isNaN(monto) || monto < 0) {
            return res.status(400).json({
                mensaje: 'El monto vendido debe ser un valor numérico igual o mayor a 0.'
            });
        }

        // Buscar la venta que queremos editar
        const venta = await db.get(
            'SELECT * FROM ventas WHERE id = ?',
            [id]
        );

        if (!venta) {
            return res.status(404).json({
                mensaje: 'La venta indicada no existe.'
            });
        }

        // El mesero debe existir
        const mesero = await db.get(
            'SELECT * FROM meseros WHERE id = ?',
            [mesero_id]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'El mesero indicado no existe.'
            });
        }

        // Mesero inactivo -> no puede tener ventas registradas
        if (mesero.estado !== 'activo') {
            return res.status(400).json({
                mensaje: 'El mesero está inactivo y no puede tener ventas registradas.'
            });
        }

        // Verificar que no exista OTRA venta
        // con el mismo mesero y la misma fecha
        const otraVenta = await db.get(
            `SELECT * FROM ventas
             WHERE mesero_id = ?
             AND fecha = ?
             AND id != ?`,
            [mesero_id, fecha, id]
        );

        if (otraVenta) {
            return res.status(409).json({
                mensaje: 'Ya existe otra venta para este mesero en esta fecha.'
            });
        }

        // Actualizar la venta
        await db.run(
            `UPDATE ventas
             SET mesero_id = ?,
                 fecha = ?,
                 total_vendido = ?
             WHERE id = ?`,
            [mesero_id, fecha, monto, id]
        );

        // Obtener la venta actualizada
        const ventaActualizada = await db.get(
            'SELECT * FROM ventas WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            mensaje: 'Venta actualizada correctamente.',
            venta: ventaActualizada
        });

    } catch (error) {
        console.error('Error en PUT /ventas/:id:', error);

        return res.status(500).json({
            mensaje: 'Error interno al actualizar la venta.'
        });
    }
});
// Get /ventas
// Lista todas las ventas o filtra por fecha
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const { fecha } = req.query;

        let ventas;

        if (fecha) {

            if (!esFechaValida(fecha)) {
                return res.status(400).json({
                    mensaje: 'La fecha debe tener el formato YYYY-MM-DD.'
                });
            }
            // Consultar ventas de un mesero en un día determinado
            ventas = await db.all(
                `SELECT v.id,
                        v.mesero_id,
                        v.fecha,
                        v.total_vendido,
                        m.nombre,
                        m.apellido,
                        m.identificacion
                 FROM ventas v
                 JOIN meseros m ON m.id = v.mesero_id
                 WHERE v.fecha = ?
                 ORDER BY v.total_vendido DESC`,
                [fecha]
            );

        } else {
            // Consultar todas las ventas
            ventas = await db.all(
                `SELECT v.id,
                        v.mesero_id,
                        v.fecha,
                        v.total_vendido,
                        m.nombre,
                        m.apellido,
                        m.identificacion
                 FROM ventas v
                 JOIN meseros m ON m.id = v.mesero_id
                 ORDER BY v.fecha DESC`
            );
        }

        return res.status(200).json(ventas);

    } catch (error) {
        console.error('Error en GET /ventas:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar las ventas.'
        });
    }
});
// get /ventas/mesero/:mesero_id 
// Historial de ventas de un mesero
router.get('/mesero/:mesero_id', async (req, res) => {
    try {
        const db = getDB();
        const { mesero_id } = req.params;

        const mesero = await db.get(
            'SELECT * FROM meseros WHERE id = ?',
            [mesero_id]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'El mesero indicado no existe.'
            });
        }

        const ventas = await db.all(
            `SELECT *
             FROM ventas
             WHERE mesero_id = ?
             ORDER BY fecha DESC`,
            [mesero_id]
        );

        return res.status(200).json(ventas);

    } catch (error) {
        console.error('Error en GET /ventas/mesero/:mesero_id:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar el historial de ventas.'
        });
    }
});


module.exports = router;