// Rutas de bonificaciones 
// Las bonificaciones se generan a partir del Top 6 del ranking. 
 
const express = require('express'); 
const router = express.Router(); 
 
const { getDB } = require('../../database/initDB'); 
 
 
// ============================================ 
// CONFIGURACIÓN 
// ============================================ 
 
const MONTO_BONIFICACION = 10000; 
 
 
// ============================================ 
// VALIDAR FORMATO DE FECHA 
// ============================================ 
 
function esFechaValida(fecha) { 
    return typeof fecha === 'string' && 
        /^\d{4}-\d{2}-\d{2}$/.test(fecha); 
} 
 
 
// ============================================ 
// GET /bonificaciones?fecha=YYYY-MM-DD 
// Consulta las bonificaciones de un domingo 
// ============================================ 
 
router.get('/', async (req, res) => { 
    try { 
        const db = getDB(); 
        const { fecha } = req.query; 
 
        // Verificar fecha 
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
 
        // Consultar bonificaciones 
        const bonificaciones = await db.all( 
            `SELECT 
                b.id, 
                b.ranking_id, 
                b.monto, 
                b.fecha_entrega, 
                b.observaciones, 
 
                r.posicion, 
                r.total_vendido, 
 
                m.id AS mesero_id, 
                m.nombre, 
                m.apellido, 
                m.identificacion 
 
             FROM bonificaciones b 
 
             JOIN rankings r 
                ON r.id = b.ranking_id 
 
             JOIN domingos d 
                ON d.id = r.domingo_id 
 
             JOIN meseros m 
                ON m.id = r.mesero_id 
 
             WHERE d.fecha = ? 
 
             ORDER BY r.posicion ASC`, 
            [fecha] 
        ); 
 
        // Calcular total 
        const totalBonificaciones = bonificaciones.reduce( 
            (total, bonificacion) => total + bonificacion.monto, 
            0 
        ); 
 
        return res.status(200).json({ 
            fecha, 
            cantidad_beneficiarios: bonificaciones.length, 
            total_bonificaciones: totalBonificaciones, 
            bonificaciones 
        }); 
 
    } catch (error) { 
        console.error('Error en GET /bonificaciones:', error); 
 
        return res.status(500).json({ 
            mensaje: 'Error interno al consultar las bonificaciones.' 
        }); 
    } 
}); 
 
 
// ============================================ 
// POST /bonificaciones/generar 
// Genera las bonificaciones del Top 6 
// ============================================ 
 
router.post('/generar', async (req, res) => { 
    try { 
        const db = getDB(); 
        const { fecha, fecha_entrega, observaciones } = req.body; 
 
        // ---------------------------------------- 
        // Validar fecha del domingo 
        // ---------------------------------------- 
 
        if (!fecha) { 
            return res.status(400).json({ 
                mensaje: 'La fecha del domingo es requerida.' 
            }); 
        } 
 
        if (!esFechaValida(fecha)) { 
            return res.status(400).json({ 
                mensaje: 'La fecha debe tener el formato YYYY-MM-DD.' 
            }); 
        } 
 
        // ---------------------------------------- 
        // Fecha de entrega 
        // ---------------------------------------- 
 
        const fechaEntrega = fecha_entrega || fecha; 
 
        if (!esFechaValida(fechaEntrega)) { 
            return res.status(400).json({ 
                mensaje: 'La fecha de entrega debe tener el formato YYYY-MM-DD.' 
            }); 
        } 
 
        // ---------------------------------------- 
        // Buscar domingo 
        // ---------------------------------------- 
 
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
                mensaje: 'El domingo aún no está cerrado. No se pueden generar las bonificaciones.'
            });
        }
 
        // ---------------------------------------- 
        // Buscar Top 6 del ranking 
        // ---------------------------------------- 
 
        const top6 = await db.all( 
            `SELECT 
                r.id AS ranking_id, 
                r.posicion, 
                r.mesero_id, 
                r.total_vendido 
             FROM rankings r 
             WHERE r.domingo_id = ? 
               AND r.top6 = 1 
             ORDER BY r.posicion ASC`, 
            [domingo.id] 
        ); 
 
        if (top6.length === 0) { 
            return res.status(400).json({ 
                mensaje: 'No existe un Top 6 generado para este domingo.' 
            }); 
        } 
 
        // ---------------------------------------- 
        // Generar bonificaciones 
        // ---------------------------------------- 
 
        const bonificacionesGeneradas = []; 
 
        for (const ranking of top6) { 
 
            // Verificar si ya existe una bonificación 
            const existente = await db.get( 
                `SELECT id 
                 FROM bonificaciones 
                 WHERE ranking_id = ?`, 
                [ranking.ranking_id] 
            ); 
 
            if (existente) { 
                continue; 
            } 
 
            const resultado = await db.run( 
                `INSERT INTO bonificaciones ( 
                    ranking_id, 
                    monto, 
                    fecha_entrega, 
                    observaciones 
                ) 
                VALUES (?, ?, ?, ?)`, 
                [ 
                    ranking.ranking_id, 
                    MONTO_BONIFICACION, 
                    fechaEntrega, 
                    observaciones || null 
                ] 
            ); 
 
            bonificacionesGeneradas.push({ 
                id: resultado.lastID, 
                ranking_id: ranking.ranking_id, 
                posicion: ranking.posicion, 
                mesero_id: ranking.mesero_id, 
                monto: MONTO_BONIFICACION, 
                fecha_entrega: fechaEntrega, 
                observaciones: observaciones || null 
            }); 
        } 
 
        // ---------------------------------------- 
        // Verificar si ya existían todas 
        // ---------------------------------------- 
 
        if (bonificacionesGeneradas.length === 0) { 
            return res.status(409).json({ 
                mensaje: 'Las bonificaciones de este Top 6 ya fueron generadas.' 
            }); 
        } 
 
        // ---------------------------------------- 
        // Respuesta 
        // ---------------------------------------- 
 
        const total = bonificacionesGeneradas.reduce( 
            (suma, bonificacion) => suma + bonificacion.monto, 
            0 
        ); 
 
        return res.status(201).json({ 
            mensaje: 'Bonificaciones generadas correctamente.', 
            fecha, 
            cantidad_beneficiarios: bonificacionesGeneradas.length, 
            total_bonificaciones: total, 
            bonificaciones: bonificacionesGeneradas 
        }); 
 
    } catch (error) { 
        console.error('Error en POST /bonificaciones/generar:', error); 
 
        return res.status(500).json({ 
            mensaje: 'Error interno al generar las bonificaciones.' 
        }); 
    } 
}); 
 
 
// ============================================ 
// GET /bonificaciones/:id 
// Consulta una bonificación específica 
// ============================================ 
 
router.get('/:id', async (req, res) => { 
    try { 
        const db = getDB(); 
        const { id } = req.params; 
 
        const bonificacion = await db.get( 
            `SELECT 
                b.id, 
                b.ranking_id, 
                b.monto, 
                b.fecha_entrega, 
                b.observaciones, 
 
                r.posicion, 
                r.total_vendido, 
 
                m.id AS mesero_id, 
                m.nombre, 
                m.apellido, 
                m.identificacion, 
 
                d.fecha AS fecha_domingo 
 
             FROM bonificaciones b 
 
             JOIN rankings r 
                ON r.id = b.ranking_id 
 
             JOIN meseros m 
                ON m.id = r.mesero_id 
 
             JOIN domingos d 
                ON d.id = r.domingo_id 
 
             WHERE b.id = ?`, 
            [id] 
        ); 
 
        if (!bonificacion) { 
            return res.status(404).json({ 
                mensaje: 'Bonificación no encontrada.' 
            }); 
        } 
 
        return res.status(200).json(bonificacion); 
 
    } catch (error) { 
        console.error('Error en GET /bonificaciones/:id:', error); 
 
        return res.status(500).json({ 
            mensaje: 'Error interno al consultar la bonificación.' 
        }); 
    } 
}); 
 
 
module.exports = router;