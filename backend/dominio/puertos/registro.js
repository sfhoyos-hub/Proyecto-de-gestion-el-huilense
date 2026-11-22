// Registro de puertos: conecta cada puerto con el adaptador que lo implementa.
//
// La lógica de negocio pide un puerto por nombre (puerto('repositorio.ventas'))
// y nunca hace require de la infraestructura. La raíz de composición
// (backend/contenedor.js) registra las implementaciones al arrancar.
// Así la dependencia apunta hacia el dominio: «import» (implementa puertos).

const implementaciones = new Map();

// Verifica que el objeto cumpla el contrato del puerto (que sea instancia de
// la clase puerto y que sobrescriba todos sus métodos).
function verificarContrato(nombre, implementacion, Puerto) {
    if (!(implementacion instanceof Puerto)) {
        throw new Error(`"${nombre}" no implementa el puerto ${Puerto.name}`);
    }

    for (const metodo of Object.getOwnPropertyNames(Puerto.prototype)) {
        if (metodo !== 'constructor' &&
            implementacion[metodo] === Puerto.prototype[metodo]) {
            throw new Error(`"${nombre}" no implementa ${Puerto.name}.${metodo}`);
        }
    }
}

// Crea un objeto que implementa el puerto a partir de funciones sueltas
// (así los repositorios siguen escritos como módulos de funciones).
function implementar(Puerto, metodos) {
    return Object.assign(Object.create(Puerto.prototype), metodos);
}

function registrar(nombre, implementacion, Puerto) {
    verificarContrato(nombre, implementacion, Puerto);
    implementaciones.set(nombre, implementacion);
}

function resolver(nombre) {
    const implementacion = implementaciones.get(nombre);

    if (!implementacion) {
        throw new Error(`No hay implementación registrada para el puerto "${nombre}"`);
    }

    return implementacion;
}

// Devuelve una referencia perezosa: el adaptador se busca en el momento de
// usarlo, por eso los servicios pueden pedir el puerto al cargarse.
function puerto(nombre) {
    return new Proxy({}, {
        get(_, propiedad) {
            const implementacion = resolver(nombre);
            const valor = implementacion[propiedad];

            return typeof valor === 'function' ? valor.bind(implementacion) : valor;
        }
    });
}

module.exports = { implementar, registrar, puerto };
