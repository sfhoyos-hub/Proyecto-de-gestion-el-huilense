// Solo define rutas y middleware. La lógica vive en el controller.
const express = require('express');
const controller = require('./meseros.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.post('/', requireRole('ADMIN'), controller.registrar);
router.get('/', requireRole('ADMIN'), controller.listar);
router.get('/:id', controller.obtenerPorId);
router.patch('/:id/estado', requireRole('ADMIN'), controller.cambiarEstado);
router.put('/:id', requireRole('ADMIN'), controller.actualizar);
router.delete('/:id', requireRole('ADMIN'), controller.desactivar);

module.exports = router;
