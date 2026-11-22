// Raíz de composición (composition root).
// Es el único lugar que conoce a la vez los puertos del dominio y los
// adaptadores de infraestructura que los implementan. La lógica de negocio
// solo pide puertos por nombre (dominio/puertos/registro.js).
const { registrar } = require('./dominio/puertos/registro');
const IRepositorio = require('./dominio/puertos/IRepositorio');
const IAuditoria = require('./dominio/puertos/IAuditoria');
const { auditoria } = require('./infraestructura/auditoria/registroAuditoria');

// Paquete Persistencia: un repositorio por agregado.
const REPOSITORIOS = [
    'login', 'meseros', 'domingos', 'ventas', 'ranking', 'racha',
    'bonificaciones'
];

let configurado = false;

function configurar() {
    if (configurado) {
        return;
    }

    for (const nombre of REPOSITORIOS) {
        registrar(`repositorio.${nombre}`,
            require(`./infraestructura/persistencia/repositorios/${nombre}.repository`),
            IRepositorio);
    }

    registrar('auditoria', auditoria, IAuditoria);

    configurado = true;
}

module.exports = { configurar };
