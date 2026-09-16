const fs = require('fs');
const path = require('path');

// Recorre la carpeta modulos/ y monta automáticamente
// cada módulo que tenga un archivo <nombre>.routes.js
function cargarRutas(app) {
    const modulosDir = __dirname;

    const carpetas = fs.readdirSync(modulosDir).filter((f) =>
        fs.statSync(path.join(modulosDir, f)).isDirectory()
    );

    carpetas.forEach((carpeta) => {
        const archivoRutas = path.join(modulosDir, carpeta, `${carpeta}.routes.js`);

        if (fs.existsSync(archivoRutas)) {
            app.use(`/${carpeta}`, require(archivoRutas));
            console.log(`Ruta cargada: /${carpeta}`);
        }
    });
}

module.exports = cargarRutas;