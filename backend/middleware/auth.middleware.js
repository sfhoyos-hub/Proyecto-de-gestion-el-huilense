
const jwt = require('jsonwebtoken');
const { getDB } = require('../database/initDB');

async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            mensaje: 'Debes iniciar sesión para acceder a este recurso'
        });
    }

    const token = authorization.slice(7).trim();

    if (!process.env.JWT_SECRET) {
        console.error('Falta configurar JWT_SECRET');
        return res.status(500).json({
            mensaje: 'La autenticación no está configurada'
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const db = getDB();

        const usuario = await db.get(
            `SELECT id, name, email, rol, estado
             FROM users
             WHERE id = ?`,
            [payload.sub]
        );

        if (!usuario) {
            return res.status(401).json({
                mensaje: 'La sesión ya no es válida'
            });
        }

        if (usuario.rol === 'MESERO') {
            const mesero = await db.get(
                'SELECT id, estado FROM meseros WHERE user_id = ?',
                [usuario.id]
            );

            if (!mesero || usuario.estado === 'inactivo' ||
                mesero.estado === 'inactivo') {
                return res.status(403).json({
                    mensaje: 'La cuenta se encuentra inactiva'
                });
            }

            req.user = {
                ...usuario,
                mesero_id: mesero.id,
                estado_mesero: mesero.estado
            };
        } else {
            if (usuario.estado !== 'activo') {
                return res.status(403).json({
                    mensaje: 'La cuenta no está activa'
                });
            }

            req.user = usuario;
        }

        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError' ||
            error.name === 'NotBeforeError') {
            return res.status(401).json({
                mensaje: 'Token inválido o expirado'
            });
        }

        console.error('Error verificando autenticación:', error);
        return res.status(500).json({
            mensaje: 'Error al verificar la autenticación'
        });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.rol)) {
            return res.status(403).json({
                mensaje: 'No tienes permisos para realizar esta operación'
            });
        }

        return next();
    };
}

module.exports = {
    requireAuth,
    requireRole
};
