// Solo define rutas y middleware.
const express = require('express');
const controller = require('./ventas.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.post('/', requireRole('ADMIN'), controller.registrar);
router.put('/:id', requireRole('ADMIN'), controller.editar);
router.get('/', requireRole('ADMIN'), controller.listar);
router.get('/mesero/:mesero_id', requireRole('ADMIN', 'MESERO'),
    controller.historialDeMesero);

module.exports = router;
