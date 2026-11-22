require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path'); // 1. Importamos path para manejar rutas de carpetas
const { initDB } = require('./infraestructura/persistencia/initDB');
const { configurar } = require('./contenedor');
const auditarAccesosDenegados = require('./aplicacion/seguridad/auditoriaAccesos.middleware');
const errorHandler = require('./aplicacion/api/errorHandler');
const cargarRutas = require('./aplicacion/api');

// Raíz de composición: conecta cada puerto del dominio con su adaptador.
configurar();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// 2. Servir los archivos estáticos de la carpeta 'frontend' que está en la raíz
app.use(express.static(path.join(__dirname, '../frontend')));

cargarRutas(app);

app.get('/', (req, res) => {
    res.json({
        mensaje: 'API de El Huilense funcionando correctamente'
    });
});

// Siempre después de todas las rutas: primero se audita, luego se responde.
app.use(auditarAccesosDenegados);
app.use(errorHandler);

initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor de El Huilense escuchando en http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('No se pudo inicializar la base de datos:', error.message);
        process.exit(1);
    });