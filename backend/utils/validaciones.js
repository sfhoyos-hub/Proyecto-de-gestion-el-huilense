// Validaciones compartidas por todos los módulos.

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Fecha con formato YYYY-MM-DD que además existe en el calendario.
function esFechaValida(fecha) {
    if (typeof fecha !== 'string' || !FORMATO_FECHA.test(fecha)) {
        return false;
    }

    const fechaUTC = new Date(`${fecha}T00:00:00.000Z`);

    return !Number.isNaN(fechaUTC.getTime()) &&
        fechaUTC.toISOString().slice(0, 10) === fecha;
}

// Fecha válida (YYYY-MM-DD) que cae en domingo. Se evalúa en UTC para que
// el resultado no dependa de la zona horaria del servidor.
function esDomingo(fecha) {
    return esFechaValida(fecha) &&
        new Date(`${fecha}T00:00:00.000Z`).getUTCDay() === 0;
}

// Identificador entero positivo.
function esIdValido(id) {
    const numero = Number(id);

    return Number.isSafeInteger(numero) && numero > 0;
}

// Devuelve el monto como número, o null si no es válido (>= 0 y finito).
function obtenerMontoValido(valor) {
    const tipoPermitido = ['number', 'string'].includes(typeof valor);

    if (!tipoPermitido || (typeof valor === 'string' && !valor.trim())) {
        return null;
    }

    const monto = Number(valor);

    return Number.isFinite(monto) && monto >= 0 ? monto : null;
}

// Texto no vacío (ignora espacios).
function esTextoNoVacio(valor) {
    return typeof valor === 'string' && valor.trim() !== '';
}

module.exports = {
    esFechaValida,
    esDomingo,
    esIdValido,
    obtenerMontoValido,
    esTextoNoVacio
};
