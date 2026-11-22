// Reglas de negocio. No usa req/res ni SQL: solo habla con el repository.
const { puerto } = require('../../dominio/puertos/registro');
const repo = puerto('repositorio.meseros');
const { AppError } = require('../../utils/errores');
const { esIdValido, esTextoNoVacio } = require('../../utils/validaciones');
const { ESTADO_USUARIO } = require('../../utils/estados');
const { hashearPassword } = require('../../utils/passwords');
const auditoria = puerto('auditoria');

const ESTADOS_VALIDOS = Object.values(ESTADO_USUARIO);
const MIN_PASSWORD = 8;

// ---------- Validaciones ----------

function validarId(id) {
    if (!esIdValido(id)) {
        throw new AppError(400, 'El ID del mesero no es válido');
    }

    return Number(id);
}

function todosSonTexto(valores) {
    return valores.every(esTextoNoVacio);
}

function normalizarCampos(body, correo = body.email) {
    return {
        name: body.name.trim(),
        correo: correo.trim().toLowerCase(),
        identificacion: body.identificacion.trim(),
        nombre: body.nombre.trim(),
        apellido: body.apellido.trim(),
        fecha_ingreso: body.fecha_ingreso.trim()
    };
}

function validarDatosRegistro(body) {
    const { name, email, password, identificacion,
        nombre, apellido, fecha_ingreso } = body;

    if (!todosSonTexto([name, email, password, identificacion,
        nombre, apellido, fecha_ingreso])) {
        throw new AppError(400, 'Todos los campos son obligatorios');
    }

    if (password.length < MIN_PASSWORD) {
        throw new AppError(400, 'La contraseña debe tener al menos 8 caracteres');
    }

    return { ...normalizarCampos(body), password };
}

function validarPasswordOpcional(password) {
    const vacio = password === undefined || password === null || password === '';

    if (!vacio && (typeof password !== 'string' ||
        password.length < MIN_PASSWORD)) {
        throw new AppError(400,
            'La nueva contraseña debe tener al menos 8 caracteres');
    }
}

// Acepta mayúsculas o minúsculas y devuelve el valor en mayúsculas.
function normalizarEstado(estado) {
    const normalizado = typeof estado === 'string'
        ? estado.trim().toUpperCase()
        : estado;

    if (!ESTADOS_VALIDOS.includes(normalizado)) {
        throw new AppError(400, 'Estado inválido. Usa ACTIVO o INACTIVO');
    }

    return normalizado;
}

function normalizarEstadoOpcional(estado) {
    return estado === undefined ? undefined : normalizarEstado(estado);
}

function validarDatosActualizacion(body) {
    const { name, email, identificacion, nombre, apellido, fecha_ingreso } = body;

    if (!todosSonTexto([name, email, identificacion,
        nombre, apellido, fecha_ingreso])) {
        throw new AppError(400,
            'Nombre, correo, identificación, apellidos y fecha de ingreso son obligatorios');
    }

    validarPasswordOpcional(body.password);

    return {
        ...normalizarCampos(body),
        estado: normalizarEstadoOpcional(body.estado)
    };
}

// ---------- Reglas de unicidad ----------

async function verificarCorreoLibre(correo, excluirUserId) {
    if (await repo.buscarUsuarioPorCorreo(correo, excluirUserId)) {
        throw new AppError(409, 'El correo electrónico ya está registrado');
    }
}

async function verificarIdentificacionLibre(identificacion, excluirId) {
    if (await repo.buscarPorIdentificacion(identificacion, excluirId)) {
        throw new AppError(409, 'La identificación ya está registrada');
    }
}

async function obtenerMeseroExistente(id) {
    const mesero = await repo.buscarBasico(id);

    if (!mesero) {
        throw new AppError(404, 'Mesero no encontrado');
    }

    return mesero;
}

// ---------- Operaciones ----------

// Registra en la auditoría un cambio de cuenta de un mesero (sin contraseñas).
function auditarCuenta(usuario, meseroId, anterior, nuevo) {
    return auditoria.registrarCambioCuenta({
        usuario, entidad: 'MESERO', entidadId: meseroId, anterior, nuevo
    });
}

async function crearUsuarioYMesero(datos, passwordHash, usuario) {
    const creado = await repo.insertarUsuario({ ...datos, passwordHash });
    const mesero = await repo.insertarMesero(
        { ...datos, userId: creado.lastID }
    );

    await auditarCuenta(usuario, mesero.lastID, null,
        { correo: datos.correo, estado: ESTADO_USUARIO.ACTIVO });

    return { mesero_id: mesero.lastID, user_id: creado.lastID };
}

async function registrar(body, usuario) {
    const datos = validarDatosRegistro(body);

    await verificarCorreoLibre(datos.correo);
    await verificarIdentificacionLibre(datos.identificacion);

    const passwordHash = await hashearPassword(datos.password);

    return repo.enTransaccion(
        () => crearUsuarioYMesero(datos, passwordHash, usuario)
    );
}

function listar() {
    return repo.listar();
}

function verificarPermisoDeConsulta(mesero, usuario) {
    if (usuario.rol !== 'ADMIN' && usuario.mesero_id !== mesero.id) {
        throw new AppError(403, 'Solo puedes consultar tus propios datos');
    }
}

async function obtenerPorId(idParam, usuario) {
    const id = validarId(idParam);
    const mesero = await repo.buscarConUsuario(id);

    if (!mesero) {
        throw new AppError(404, 'Mesero no encontrado');
    }

    verificarPermisoDeConsulta(mesero, usuario);
    return mesero;
}

async function calcularHashOpcional(password) {
    return typeof password === 'string' && password.length > 0
        ? hashearPassword(password)
        : null;
}

// Solo incluye lo que realmente cambió; la contraseña nunca se guarda.
function detectarCambios(actual, datos, estado, passwordHash) {
    const anterior = {};
    const nuevo = {};

    if (actual.email !== datos.correo) {
        anterior.correo = actual.email;
        nuevo.correo = datos.correo;
    }

    if (actual.estado !== estado) {
        anterior.estado = actual.estado;
        nuevo.estado = estado;
    }

    if (passwordHash) {
        nuevo.contrasena = 'ACTUALIZADA';
    }

    return { anterior, nuevo };
}

async function auditarCambiosDeCuenta(usuario, mesero, cambios) {
    if (Object.keys(cambios.nuevo).length > 0) {
        await auditarCuenta(usuario, mesero.id, cambios.anterior, cambios.nuevo);
    }
}

function guardarCambios(mesero, datos, estado, passwordHash, usuario) {
    const cambios = detectarCambios(mesero, datos, estado, passwordHash);

    return repo.enTransaccion(async () => {
        await repo.actualizarUsuario(mesero.user_id, {
            ...datos,
            estado,
            passwordHash
        });
        await repo.actualizarMesero(mesero.id, { ...datos, estado });
        await auditarCambiosDeCuenta(usuario, mesero, cambios);
    });
}

async function actualizar(idParam, body, usuario) {
    const id = validarId(idParam);
    const datos = validarDatosActualizacion(body);
    const mesero = await obtenerMeseroExistente(id);

    await verificarCorreoLibre(datos.correo, mesero.user_id);
    await verificarIdentificacionLibre(datos.identificacion, id);

    const estado = datos.estado ?? mesero.estado;
    const passwordHash = await calcularHashOpcional(body.password);

    await guardarCambios(mesero, datos, estado, passwordHash, usuario);
}

// Mesero y usuario siempre cambian de estado juntos y queda auditado.
function aplicarEstado(mesero, estado, usuario) {
    return repo.enTransaccion(async () => {
        await repo.actualizarEstadoMesero(mesero.id, estado);
        await repo.actualizarEstadoUsuario(mesero.user_id, estado);
        await auditarCuenta(usuario, mesero.id,
            { estado: mesero.estado }, { estado });
    });
}

async function cambiarEstado(idParam, body, usuario) {
    const id = validarId(idParam);
    const estado = normalizarEstado(body?.estado);
    const mesero = await obtenerMeseroExistente(id);

    await aplicarEstado(mesero, estado, usuario);

    return { id, estado };
}

async function desactivar(idParam, usuario) {
    const id = validarId(idParam);
    const mesero = await obtenerMeseroExistente(id);

    await aplicarEstado(mesero, ESTADO_USUARIO.INACTIVO, usuario);
}

module.exports = {
    registrar,
    listar,
    obtenerPorId,
    actualizar,
    cambiarEstado,
    desactivar
};
