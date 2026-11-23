// Solo define rutas y middleware.
const express = require('express');
const controller = require('./temporadas.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', controller.listar);
router.post('/', controller.crear);

module.exports = router;
