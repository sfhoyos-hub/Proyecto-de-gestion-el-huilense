
const express = require('express');
const { getDB } = require('../../database/initDB');
const {
    requireAuth,
    requireRole
} = require('../../middleware/auth.middleware');

const router = express.Router();

// Todas las rutas requieren un usuario autenticado.
router.use(requireAuth);

// Valida que la fecha tenga formato YYYY-MM-DD y exista realmente.
function esFechaValida(fecha) {
    if (typeof fecha !== 'string') {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const fechaUTC = new Date(`${fecha}T00:00:00.000Z`);

    return !Number.isNaN(fechaUTC.getTime()) &&
        fechaUTC.toISOString().slice(0, 10) === fecha;
}

// Valida identificadores enteros positivos.
function esIdValido(id) {
    const numero = Number(id);

    return Number.isSafeInteger(numero) && numero > 0;
}

// Valida montos finitos, numéricos y no negativos.
function obtenerMontoValido(valor) {
    if (
        valor === null ||
        valor === undefined ||
        typeof valor === 'boolean' ||
        (typeof valor === 'string' && valor.trim() === '') ||
        !['number', 'string'].includes(typeof valor)
    ) {
        return null;
    }

    const monto = Number(valor);

    return Number.isFinite(monto) && monto >= 0
        ? monto
        : null;
}

// Busca un domingo registrado y verifica si está cerrado.
async function obtenerDomingoAbierto(db, fecha) {
    const domingo = await db.get(
        'SELECT id, fecha, cerrado FROM domingos WHERE fecha = ?',
        [fecha]
    );

    if (!domingo) {
        return {
            error: {
                status: 404,
                mensaje: 'No existe un domingo registrado con esa fecha.'
            }
        };
    }

    if (Number(domingo.cerrado) === 1) {
        return {
            error: {
                status: 409,
                mensaje: 'El domingo está cerrado y no permite registrar o modificar ventas.'
            }
        };
    }

    return { domingo };
}

// POST /ventas
// Registra una venta. Solo ADMIN.
router.post('/', requireRole('ADMIN'), async (req, res) => {
    try {
        const db = getDB();
        const { mesero_id, fecha, total_vendido } = req.body;

        if (
            mesero_id === undefined ||
            !fecha ||
            total_vendido === undefined
        ) {
            return res.status(400).json({
                mensaje: 'Todos los campos son requeridos: mesero_id, fecha, total_vendido.'
            });
        }

        if (!esIdValido(mesero_id)) {
            return res.status(400).json({
                mensaje: 'mesero_id debe ser un entero positivo.'
            });
        }

        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe ser una fecha real con formato YYYY-MM-DD.'
            });
        }

        const monto = obtenerMontoValido(total_vendido);

        if (monto === null) {
            return res.status(400).json({
                mensaje: 'El monto vendido debe ser un número finito igual o mayor a 0.'
            });
        }

        const mesero = await db.get(
            'SELECT id, estado FROM meseros WHERE id = ?',
            [Number(mesero_id)]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'El mesero indicado no existe.'
            });
        }

        if (mesero.estado !== 'activo') {
            return res.status(400).json({
                mensaje: 'El mesero no está activo y no puede tener ventas registradas.'
            });
        }

        const resultadoDomingo = await obtenerDomingoAbierto(db, fecha);

        if (resultadoDomingo.error) {
            return res.status(resultadoDomingo.error.status).json({
                mensaje: resultadoDomingo.error.mensaje
            });
        }

        const { domingo } = resultadoDomingo;

        const ventaExistente = await db.get(
            `SELECT id FROM ventas
             WHERE mesero_id = ? AND domingo_id = ?`,
            [Number(mesero_id), domingo.id]
        );

        if (ventaExistente) {
            return res.status(409).json({
                mensaje: 'Ya existe una venta para este mesero en esta fecha. Use PUT para editarla.'
            });
        }

        const resultado = await db.run(
            `INSERT INTO ventas (mesero_id, domingo_id, total_vendido)
             VALUES (?, ?, ?)`,
            [Number(mesero_id), domingo.id, monto]
        );

        const ventaGuardada = await db.get(
            `SELECT v.id, v.mesero_id, d.fecha, v.total_vendido
             FROM ventas v
             JOIN domingos d ON d.id = v.domingo_id
             WHERE v.id = ?`,
            [resultado.lastID]
        );

        return res.status(201).json({
            mensaje: 'Venta registrada correctamente.',
            venta: ventaGuardada
        });
    } catch (error) {
        console.error('Error en POST /ventas:', error);

        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({
                mensaje: 'No se pudo registrar la venta porque existe un registro duplicado o se incumple una restricción.'
            });
        }

        return res.status(500).json({
            mensaje: 'Error interno al registrar la venta.'
        });
    }
});

// PUT /ventas/:id
// Edita una venta. Solo ADMIN.
router.put('/:id', requireRole('ADMIN'), async (req, res) => {
    try {
        const db = getDB();
        const id = Number(req.params.id);
        const { mesero_id, fecha, total_vendido } = req.body;

        if (!esIdValido(id)) {
            return res.status(400).json({
                mensaje: 'El identificador de la venta debe ser un entero positivo.'
            });
        }

        if (
            mesero_id === undefined ||
            !fecha ||
            total_vendido === undefined
        ) {
            return res.status(400).json({
                mensaje: 'Todos los campos son requeridos: mesero_id, fecha, total_vendido.'
            });
        }

        if (!esIdValido(mesero_id)) {
            return res.status(400).json({
                mensaje: 'mesero_id debe ser un entero positivo.'
            });
        }

        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe ser una fecha real con formato YYYY-MM-DD.'
            });
        }

        const monto = obtenerMontoValido(total_vendido);

        if (monto === null) {
            return res.status(400).json({
                mensaje: 'El monto vendido debe ser un número finito igual o mayor a 0.'
            });
        }

        const venta = await db.get(
            `SELECT v.id, v.domingo_id, d.cerrado
             FROM ventas v
             JOIN domingos d ON d.id = v.domingo_id
             WHERE v.id = ?`,
            [id]
        );

        if (!venta) {
            return res.status(404).json({
                mensaje: 'La venta indicada no existe.'
            });
        }

        if (Number(venta.cerrado) === 1) {
            return res.status(409).json({
                mensaje: 'La venta pertenece a un domingo cerrado y no puede modificarse.'
            });
        }

        const mesero = await db.get(
            'SELECT id, estado FROM meseros WHERE id = ?',
            [Number(mesero_id)]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'El mesero indicado no existe.'
            });
        }

        if (mesero.estado !== 'activo') {
            return res.status(400).json({
                mensaje: 'El mesero no está activo y no puede tener ventas registradas.'
            });
        }

        const resultadoDomingo = await obtenerDomingoAbierto(db, fecha);

        if (resultadoDomingo.error) {
            return res.status(resultadoDomingo.error.status).json({
                mensaje: resultadoDomingo.error.mensaje
            });
        }

        const { domingo } = resultadoDomingo;

        const otraVenta = await db.get(
            `SELECT id FROM ventas
             WHERE mesero_id = ?
               AND domingo_id = ?
               AND id != ?`,
            [Number(mesero_id), domingo.id, id]
        );

        if (otraVenta) {
            return res.status(409).json({
                mensaje: 'Ya existe otra venta para este mesero en esta fecha.'
            });
        }

        await db.run(
            `UPDATE ventas
             SET mesero_id = ?,
                 domingo_id = ?,
                 total_vendido = ?
             WHERE id = ?`,
            [Number(mesero_id), domingo.id, monto, id]
        );

        const ventaActualizada = await db.get(
            `SELECT v.id, v.mesero_id, d.fecha, v.total_vendido
             FROM ventas v
             JOIN domingos d ON d.id = v.domingo_id
             WHERE v.id = ?`,
            [id]
        );

        return res.status(200).json({
            mensaje: 'Venta actualizada correctamente.',
            venta: ventaActualizada
        });
    } catch (error) {
        console.error('Error en PUT /ventas/:id:', error);

        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({
                mensaje: 'No se pudo actualizar la venta porque existe un registro duplicado o se incumple una restricción.'
            });
        }

        return res.status(500).json({
            mensaje: 'Error interno al actualizar la venta.'
        });
    }
});

// GET /ventas
// Consulta todas las ventas o filtra por fecha. Solo ADMIN.
router.get('/', requireRole('ADMIN'), async (req, res) => {
    try {
        const db = getDB();
        const { fecha } = req.query;

        if (fecha !== undefined && !esFechaValida(fecha)) {
            return res.status(400).json({
                mensaje: 'La fecha debe ser una fecha real con formato YYYY-MM-DD.'
            });
        }

        let consulta = `
            SELECT v.id,
                   v.mesero_id,
                   d.fecha,
                   v.total_vendido,
                   m.nombre,
                   m.apellido,
                   m.identificacion
            FROM ventas v
            JOIN domingos d ON d.id = v.domingo_id
            JOIN meseros m ON m.id = v.mesero_id
        `;

        const parametros = [];

        if (fecha !== undefined) {
            consulta += ' WHERE d.fecha = ?';
            parametros.push(fecha);
        }

        consulta += ' ORDER BY d.fecha DESC, v.total_vendido DESC';

        const ventas = await db.all(consulta, parametros);

        return res.status(200).json(ventas);
    } catch (error) {
        console.error('Error en GET /ventas:', error);

        return res.status(500).json({
            mensaje: 'Error interno al consultar las ventas.'
        });
    }
});

// GET /ventas/mesero/:mesero_id
// ADMIN consulta cualquier historial.
// MESERO consulta únicamente su propio historial.
router.get(
    '/mesero/:mesero_id',
    requireRole('ADMIN', 'MESERO'),
    async (req, res) => {
        try {
            const db = getDB();
            const meseroId = Number(req.params.mesero_id);

            if (!esIdValido(meseroId)) {
                return res.status(400).json({
                    mensaje: 'El identificador del mesero debe ser un entero positivo.'
                });
            }

            if (
                req.user.rol === 'MESERO' &&
                Number(req.user.mesero_id) !== meseroId
            ) {
                return res.status(403).json({
                    mensaje: 'No tienes permiso para consultar el historial de otro mesero.'
                });
            }

            const mesero = await db.get(
                'SELECT id FROM meseros WHERE id = ?',
                [meseroId]
            );

            if (!mesero) {
                return res.status(404).json({
                    mensaje: 'El mesero indicado no existe.'
                });
            }

            const ventas = await db.all(
                `SELECT v.id,
                        v.mesero_id,
                        d.fecha,
                        v.total_vendido
                 FROM ventas v
                 JOIN domingos d ON d.id = v.domingo_id
                 WHERE v.mesero_id = ?
                 ORDER BY d.fecha DESC`,
                [meseroId]
            );

            return res.status(200).json(ventas);
        } catch (error) {
            console.error('Error en GET /ventas/mesero/:mesero_id:', error);

            return res.status(500).json({
                mensaje: 'Error interno al consultar el historial de ventas.'
            });
        }
    }
);

module.exports = router;
