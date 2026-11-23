// Solo define rutas y middleware.
const express = require('express');
const controller = require('./notificaciones.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth, requireRole('MESERO'));

router.get('/', controller.listar);
router.patch('/:id/leida', controller.marcarLeida);

module.exports = router;
