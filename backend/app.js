const express = require('express');
const cors = require('cors');
const { initDB } = require('./database/initDB');
const cargarRutas = require('./modulos');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

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