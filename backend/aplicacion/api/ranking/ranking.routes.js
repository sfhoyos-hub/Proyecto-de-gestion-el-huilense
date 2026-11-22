// Solo define rutas y middleware.
const express = require('express');
const controller = require('./ranking.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, requireRole('ADMIN'), controller.consultar);
router.get('/top6', requireAuth, requireRole('ADMIN'), controller.consultarTop6);
router.get('/mi-puesto', requireAuth, requireRole('MESERO'), controller.miPuesto);

module.exports = router;
