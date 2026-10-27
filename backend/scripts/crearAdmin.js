
require('dotenv').config();

const bcrypt = require('bcrypt');
const { initDB } = require('../database/initDB');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function preguntar(texto) {
    return new Promise(resolve => rl.question(texto, resolve));
}

async function main() {
    let db;

    try {
        db = await initDB();

        const administradores = await db.get(
            "SELECT COUNT(*) AS total FROM users WHERE rol = 'ADMIN'"
        );

        if (administradores.total > 0) {
            console.log('Ya existe una cuenta ADMIN. No se creó otra.');
            return;
        }

        const name = (await preguntar('Nombre del administrador: ')).trim();
        const email = (await preguntar('Correo del administrador: '))
            .trim()
            .toLowerCase();
        const password = await preguntar(
            'Contraseña nueva (mínimo 12 caracteres): '
        );

        if (!name || !email || password.length < 12) {
            throw new Error(
                'Debes indicar nombre, correo y una contraseña de al menos 12 caracteres.'
            );
        }

        const existente = await db.get(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existente) {
            throw new Error(
                'Ese correo ya pertenece a otra cuenta. Usa un correo diferente.'
            );
        }

        const hash = await bcrypt.hash(password, 12);

        await db.run(
            `INSERT INTO users (name, email, password, rol, estado)
             VALUES (?, ?, ?, 'ADMIN', 'activo')`,
            [name, email, hash]
        );

        console.log('Administrador creado correctamente.');
        console.log('Correo:', email);
        console.log('Guarda tu contraseña en un lugar seguro.');
    } finally {
        rl.close();

        if (db) {
            await db.close();
        }
    }
}

main().catch(error => {
    console.error('No se pudo crear el administrador:', error.message);
    process.exitCode = 1;
});
