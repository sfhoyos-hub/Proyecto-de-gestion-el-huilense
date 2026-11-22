// Solo SQL. La tabla de auditoría es de solo escritura (ver initDB).
const { getDB } = require('../persistencia/initDB');

function insertar(registro) {
    return getDB().run(
        `INSERT INTO auditoria
            (fecha, tipo, usuario_id, rol, accion, entidad, entidad_id,
             valor_anterior, valor_nuevo, detalle, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [registro.fecha, registro.tipo, registro.usuarioId, registro.rol,
            registro.accion, registro.entidad, registro.entidadId,
            registro.valorAnterior, registro.valorNuevo, registro.detalle,
            registro.ip]
    );
}

module.exports = { insertar };
