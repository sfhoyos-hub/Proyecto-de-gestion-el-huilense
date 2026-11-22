// Solo define rutas.
const express = require('express');
const controller = require('./login.controller');

const router = express.Router();

router.post('/', controller.iniciarSesion);

module.exports = router;
