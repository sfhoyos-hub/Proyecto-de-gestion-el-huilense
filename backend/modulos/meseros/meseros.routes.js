const express = require('express');
const bcrypt = require('bcrypt');
const { getDB } = require('../../database/initDB');
const {
    requireAuth,
    requireRole
} = require('../../middleware/auth.middleware');

const router = express.Router();
const SALT_ROUNDS = 12;
const ESTADOS_VALIDOS = ['activo', 'descanso', 'inactivo'];

function responderError(res, error, operacion) {
    console.error(`Error al ${operacion}:`, error);

    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        String(error.message).includes('UNIQUE constraint failed')) {
        return res.status(409).json({
            mensaje: 'El correo o la identificación ya están registrados'
        });
    }

    return res.status(500).json({
        mensaje: `Error al ${operacion}`
    });
}

// Todas las rutas de este módulo requieren autenticación.
router.use(requireAuth);

// =====================================================
// POST /meseros
// Registrar un mesero. Solo ADMIN.
// =====================================================
router.post('/', requireRole('ADMIN'), async (req, res) => {
    const {
        name,
        email,
        password,
        identificacion,
        nombre,
        apellido,
        fecha_ingreso
    } = req.body;

    if (
        ![name, email, password, identificacion, nombre, apellido,
            fecha_ingreso].every(
            valor => typeof valor === 'string' && valor.trim() !== ''
        )
    ) {
        return res.status(400).json({
            mensaje: 'Todos los campos son obligatorios'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            mensaje: 'La contraseña debe tener al menos 8 caracteres'
        });
    }

    const correo = email.trim().toLowerCase();
    const db = getDB();
    let transaccionIniciada = false;

    try {
        const usuarioExistente = await db.get(
            'SELECT id FROM users WHERE email = ?',
            [correo]
        );

        if (usuarioExistente) {
            return res.status(409).json({
                mensaje: 'El correo electrónico ya está registrado'
            });
        }

        const identificacionExistente = await db.get(
            'SELECT id FROM meseros WHERE identificacion = ?',
            [identificacion.trim()]
        );

        if (identificacionExistente) {
            return res.status(409).json({
                mensaje: 'La identificación ya está registrada'
            });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        await db.exec('BEGIN IMMEDIATE');
        transaccionIniciada = true;

        const usuario = await db.run(
            `INSERT INTO users (name, email, password, rol, estado)
             VALUES (?, ?, ?, 'MESERO', 'activo')`,
            [name.trim(), correo, passwordHash]
        );

        const mesero = await db.run(
            `INSERT INTO meseros
             (user_id, identificacion, nombre, apellido, fecha_ingreso, estado)
             VALUES (?, ?, ?, ?, ?, 'activo')`,
            [
                usuario.lastID,
                identificacion.trim(),
                nombre.trim(),
                apellido.trim(),
                fecha_ingreso.trim()
            ]
        );

        await db.exec('COMMIT');
        transaccionIniciada = false;

        return res.status(201).json({
            mensaje: 'Mesero registrado correctamente',
            mesero_id: mesero.lastID,
            user_id: usuario.lastID
        });
    } catch (error) {
        if (transaccionIniciada) {
            try {
                await db.exec('ROLLBACK');
            } catch (rollbackError) {
                console.error('Error al revertir registro:', rollbackError);
            }
        }

        return responderError(res, error, 'registrar el mesero');
    }
});

// =====================================================
// GET /meseros
// Listar meseros. Solo ADMIN.
// =====================================================
router.get('/', requireRole('ADMIN'), async (req, res) => {
    try {
        const db = getDB();

        const meseros = await db.all(`
            SELECT
                m.id,
                m.user_id,
                m.identificacion,
                m.nombre,
                m.apellido,
                m.fecha_ingreso,
                m.estado,
                u.name,
                u.email
            FROM meseros m
            INNER JOIN users u ON m.user_id = u.id
            ORDER BY m.id ASC
        `);

        return res.status(200).json(meseros);
    } catch (error) {
        return responderError(res, error, 'obtener los meseros');
    }
});

// =====================================================
// GET /meseros/:id
// ADMIN consulta cualquiera; MESERO solo el suyo.
// =====================================================
router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: 'El ID del mesero no es válido'
        });
    }

    try {
        const db = getDB();

        const mesero = await db.get(`
            SELECT
                m.id,
                m.user_id,
                m.identificacion,
                m.nombre,
                m.apellido,
                m.fecha_ingreso,
                m.estado,
                u.name,
                u.email,
                u.rol
            FROM meseros m
            INNER JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `, [id]);

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'Mesero no encontrado'
            });
        }

        if (req.user.rol !== 'ADMIN' &&
            req.user.mesero_id !== mesero.id) {
            return res.status(403).json({
                mensaje: 'Solo puedes consultar tus propios datos'
            });
        }

        return res.status(200).json(mesero);
    } catch (error) {
        return responderError(res, error, 'consultar el mesero');
    }
});

// =====================================================
// PUT /meseros/:id
// Actualizar mesero. Solo ADMIN.
// La contraseña es opcional.
// =====================================================
router.put('/:id', requireRole('ADMIN'), async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: 'El ID del mesero no es válido'
        });
    }

    const {
        name,
        email,
        password,
        identificacion,
        nombre,
        apellido,
        fecha_ingreso,
        estado
    } = req.body;

    if (
        ![name, email, identificacion, nombre, apellido, fecha_ingreso]
            .every(valor =>
                typeof valor === 'string' && valor.trim() !== ''
            )
    ) {
        return res.status(400).json({
            mensaje: 'Nombre, correo, identificación, apellidos y fecha de ingreso son obligatorios'
        });
    }

    if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({
            mensaje: 'Estado inválido. Usa activo, descanso o inactivo'
        });
    }

    if (password !== undefined && password !== null &&
        password !== '' &&
        (typeof password !== 'string' || password.length < 8)) {
        return res.status(400).json({
            mensaje: 'La nueva contraseña debe tener al menos 8 caracteres'
        });
    }

    const correo = email.trim().toLowerCase();
    const db = getDB();

    try {
        const mesero = await db.get(
            'SELECT id, user_id, estado FROM meseros WHERE id = ?',
            [id]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'Mesero no encontrado'
            });
        }

        const correoExistente = await db.get(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [correo, mesero.user_id]
        );

        if (correoExistente) {
            return res.status(409).json({
                mensaje: 'El correo electrónico ya está registrado'
            });
        }

        const identificacionExistente = await db.get(
            'SELECT id FROM meseros WHERE identificacion = ? AND id != ?',
            [identificacion.trim(), id]
        );

        if (identificacionExistente) {
            return res.status(409).json({
                mensaje: 'La identificación ya está registrada'
            });
        }

        const nuevoEstado = estado ?? mesero.estado;
        const nuevoPassword =
            typeof password === 'string' && password.length > 0
                ? await bcrypt.hash(password, SALT_ROUNDS)
                : null;

        await db.exec('BEGIN IMMEDIATE');

        try {
            if (nuevoPassword) {
                await db.run(
                    `UPDATE users
                     SET name = ?, email = ?, password = ?, estado = ?
                     WHERE id = ?`,
                    [
                        name.trim(),
                        correo,
                        nuevoPassword,
                        nuevoEstado === 'inactivo' ? 'inactivo' : 'activo',
                        mesero.user_id
                    ]
                );
            } else {
                await db.run(
                    `UPDATE users
                     SET name = ?, email = ?, estado = ?
                     WHERE id = ?`,
                    [
                        name.trim(),
                        correo,
                        nuevoEstado === 'inactivo' ? 'inactivo' : 'activo',
                        mesero.user_id
                    ]
                );
            }

            await db.run(
                `UPDATE meseros
                 SET identificacion = ?,
                     nombre = ?,
                     apellido = ?,
                     fecha_ingreso = ?,
                     estado = ?
                 WHERE id = ?`,
                [
                    identificacion.trim(),
                    nombre.trim(),
                    apellido.trim(),
                    fecha_ingreso.trim(),
                    nuevoEstado,
                    id
                ]
            );

            await db.exec('COMMIT');
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }

        return res.status(200).json({
            mensaje: 'Mesero actualizado correctamente'
        });
    } catch (error) {
        return responderError(res, error, 'actualizar el mesero');
    }
});

// =====================================================
// DELETE /meseros/:id
// Desactivación lógica. Solo ADMIN.
// Se conserva el historial del mesero.
// =====================================================
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: 'El ID del mesero no es válido'
        });
    }

    const db = getDB();

    try {
        const mesero = await db.get(
            'SELECT user_id FROM meseros WHERE id = ?',
            [id]
        );

        if (!mesero) {
            return res.status(404).json({
                mensaje: 'Mesero no encontrado'
            });
        }

        await db.exec('BEGIN IMMEDIATE');

        try {
            await db.run(
                `UPDATE meseros SET estado = 'inactivo' WHERE id = ?`,
                [id]
            );

            await db.run(
                `UPDATE users SET estado = 'inactivo' WHERE id = ?`,
                [mesero.user_id]
            );

            await db.exec('COMMIT');
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }

        return res.status(200).json({
            mensaje: 'Mesero desactivado correctamente; su historial se conserva'
        });
    } catch (error) {
        return responderError(res, error, 'desactivar el mesero');
    }
});

module.exports = router;