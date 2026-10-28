require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path'); // 1. Importamos path para manejar rutas de carpetas
const { initDB } = require('./database/initDB');
const cargarRutas = require('./modulos');

const app = express();
const PORT = 3000;

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