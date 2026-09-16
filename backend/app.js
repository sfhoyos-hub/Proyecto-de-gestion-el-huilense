const express = require('express');
const cors = require('cors');
const { initDB } = require('./database/initDB');

// Importar rutas
// const bonificacionesRoutes = require('./modulos/bonificaciones/bonificaciones.routes');
const domingosRoutes = require('./modulos/domingos/domingos.routes');
const meserosRoutes = require('./modulos/meseros/meseros.routes');
// const rankingRoutes = require('./modulos/ranking/ranking.routes');
const ventasRoutes = require('./modulos/ventas/ventas.routes');

const app = express();

const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(cors());

// Rutas
//app.use('/bonificaciones', bonificacionesRoutes);
app.use('/domingos', domingosRoutes);
app.use('/meseros', meserosRoutes);
// app.use('/ranking', rankingRoutes);
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
            console.log(
                `Servidor de El Huilense escuchando en http://localhost:${PORT}`
            );
        });
    })
    .catch((error) => {
        console.error(
            'No se pudo inicializar la base de datos:',
            error.message
        );
        process.exit(1);
    });