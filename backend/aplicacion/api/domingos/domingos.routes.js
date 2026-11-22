// Solo define rutas y middleware. Todo el módulo es solo para ADMIN.
const express = require('express');
const controller = require('./domingos.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.post('/', controller.registrar);
router.get('/', controller.listar);
router.get('/:id', controller.obtenerPorId);
router.post('/:id/cerrar-corte', controller.cerrarCorte);

module.exports = router;
