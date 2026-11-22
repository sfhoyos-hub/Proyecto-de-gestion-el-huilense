// Solo define rutas y middleware. Todo el módulo es solo para ADMIN.
const express = require('express');
const controller = require('./bonificaciones.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', controller.consultar);
router.post('/generar', controller.generar);
router.get('/:id', controller.obtenerPorId);

module.exports = router;
