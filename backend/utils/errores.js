// Error controlado de la aplicación: lleva el código HTTP y el mensaje
// que se le puede mostrar al cliente.
class AppError extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.name = 'AppError';
        this.status = status;
    }
}

module.exports = { AppError };
