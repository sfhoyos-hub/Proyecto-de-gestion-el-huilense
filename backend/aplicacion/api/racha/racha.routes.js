// Solo define rutas y middleware.
const express = require('express');
const controller = require('./racha.controller');
const { requireAuth } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/:mesero_id', controller.consultar);

module.exports = router;
