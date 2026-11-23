// Raíz de composición (composition root).
// Es el único lugar que conoce a la vez los puertos del dominio y los
// adaptadores de infraestructura que los implementan. La lógica de negocio
// solo pide puertos por nombre (dominio/puertos/registro.js).
const { registrar } = require('./dominio/puertos/registro');
const IRepositorio = require('./dominio/puertos/IRepositorio');
const IAuditoria = require('./dominio/puertos/IAuditoria');
const { auditoria } = require('./infraestructura/auditoria/registroAuditoria');
const { EntregaNotificaciones } = require('./infraestructura/notificaciones/EntregaNotificaciones');
const gestorNotificaciones = require('./negocio/notificaciones/GestorNotificaciones');

// Paquete Persistencia: un repositorio por agregado.
const REPOSITORIOS = [
    'login', 'meseros', 'domingos', 'temporadas', 'ventas', 'ranking', 'racha',
    'bonificaciones', 'convocatorias', 'notificaciones'
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

    // Observer: la entrega de notificaciones se suscribe al gestor.
    gestorNotificaciones.suscribir(
        new EntregaNotificaciones(require('./infraestructura/persistencia/repositorios/notificaciones.repository'))
    );

    configurado = true;
}

module.exports = { configurar };
