require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./database/initDB');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/meseros', require('./modulos/meseros/meseros.routes'));
app.use('/ventas', require('./modulos/ventas/ventas.routes'));
app.use('/login', require('./modulos/login/login.routes'));

app.get('/', (req, res) => {
    res.send('API de El Huilense funcionando.');
});

const PORT = 3000;

initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor de El Huilense escuchando en el puerto ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('No se pudo inicializar la base de datos:', error.message);
        process.exit(1);
    });