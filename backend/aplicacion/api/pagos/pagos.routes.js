// Solo define rutas y middleware.
const express = require('express');
const controller = require('./pagos.controller');
const { requireAuth, requireRole } = require('../../seguridad/auth.middleware');

const router = express.Router();

router.use(requireAuth);

// El mesero administra su propia cuenta Nequi.
router.get('/cuenta', requireRole('MESERO'), controller.miCuenta);
router.put('/cuenta', requireRole('MESERO'), controller.guardarMiCuenta);

// El administrador consulta cuentas y paga bonificaciones.
router.get('/', requireRole('ADMIN'), controller.listar);
router.get('/cuentas/:mesero_id', requireRole('ADMIN'), controller.cuentaDeMesero);
router.put('/cuentas/:mesero_id', requireRole('ADMIN'), controller.guardarCuentaDeMesero);
router.post('/bonificaciones/:id', requireRole('ADMIN'), controller.pagarBonificacion);

module.exports = router;
