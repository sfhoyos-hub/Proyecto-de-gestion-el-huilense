// Solo define rutas y middleware.
const express = require('express');
const controller = require('./reportes.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/resumen', requireRole('ADMIN'), controller.resumen);
router.get('/historial/:mesero_id', requireRole('ADMIN', 'MESERO'), controller.historial);

module.exports = router;
