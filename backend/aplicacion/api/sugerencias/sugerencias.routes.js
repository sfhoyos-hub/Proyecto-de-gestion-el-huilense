// Solo define rutas y middleware.
const express = require('express');
const controller = require('./sugerencias.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

// Formulario público: enviar no requiere sesión.
// shortcut: sin límite de envíos por IP; agregar express-rate-limit si se publica en internet.
router.post('/', controller.crear);
router.get('/', requireAuth, requireRole('ADMIN'), controller.listar);

module.exports = router;
