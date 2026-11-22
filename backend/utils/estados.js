// Valores permitidos de los atributos de estado (enumeraciones del diagrama
// de clases). Se usan en los services y repositories; no se escriben a mano.

const ESTADO_USUARIO = Object.freeze({
    ACTIVO: 'ACTIVO',
    INACTIVO: 'INACTIVO'
});

const ESTADO_BONIFICACION = Object.freeze({
    REGISTRADA: 'REGISTRADA',
    PAGADA: 'PAGADA'
});

module.exports = { ESTADO_USUARIO, ESTADO_BONIFICACION };
