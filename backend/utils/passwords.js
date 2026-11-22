// Único lugar donde se cifran y comparan contraseñas. Nunca se comparan en
// texto plano: si lo guardado no es un hash bcrypt, la contraseña no es válida.
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;
const FORMATO_BCRYPT = /^\$2[aby]\$\d{2}\$/;

function esHashBcrypt(valor) {
    return typeof valor === 'string' && FORMATO_BCRYPT.test(valor);
}

function hashearPassword(passwordPlana) {
    return bcrypt.hash(passwordPlana, SALT_ROUNDS);
}

async function verificarPassword(passwordPlana, hash) {
    return esHashBcrypt(hash) && bcrypt.compare(passwordPlana, hash);
}

module.exports = { esHashBcrypt, hashearPassword, verificarPassword };
