// Solo define rutas y middleware.
const express = require('express');
const controller = require('./convocatorias.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/mias', requireRole('MESERO'), controller.mias);
router.post('/', requireRole('ADMIN'), controller.generar);
router.get('/:domingo_id', requireRole('ADMIN'), controller.consultar);

module.exports = router;
