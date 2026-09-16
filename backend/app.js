const express = require('express');
const cors = require('cors');
const { initDB } = require('./database/initDB');
const meserosRoutes = require('./modulos/meseros/meseros.routes');
const ventasRoutes = require('./modulos/ventas/ventas.routes');
const app = express();

const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(cors());
// Rutas 
app.use('/meseros', meserosRoutes);
app.use('/ventas', ventasRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        mensaje: 'API de El Huilense funcionando correctamente'
    });
});

// Inicializar base de datos y levantar servidor
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