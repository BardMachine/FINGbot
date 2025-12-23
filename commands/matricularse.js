const fs = require('fs');
const path = require('path');
const { materias } = require('../utils/data');

const USUARIOS_FILE = path.join(__dirname, '..', 'usuarios.json');

function loadUsuarios() {
    if (fs.existsSync(USUARIOS_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(USUARIOS_FILE, 'utf8'));
        } catch (err) {
            console.error('Error reading usuarios.json:', err);
            return {};
        }
    }
    return {};
}

function saveUsuarios(usuarios) {
    fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2));
}

module.exports = async (message, args) => {
    if (args.length === 0) {
        message.reply("Uso: ^matricularse {CODIGO} [{CODIGO2} {CODIGO3} ...]\nEjemplo: ^matricularse P3 P5 GAL1");
        return;
    }

    const codigos = args.map(c => c.toUpperCase());
    const usuarios = loadUsuarios();
    const userId = message.author.id;

    if (!usuarios[userId]) {
        usuarios[userId] = {
            id: userId,
            username: message.author.username,
            materias: []
        };
    }

    const results = [];
    const notFound = [];
    const alreadyEnrolled = [];

    for (const codigo of codigos) {
        if (!materias[codigo]) {
            notFound.push(codigo);
        } else if (usuarios[userId].materias.includes(codigo)) {
            alreadyEnrolled.push(codigo);
        } else {
            usuarios[userId].materias.push(codigo);
            results.push(codigo);
        }
    }

    if (results.length > 0) {
        saveUsuarios(usuarios);
    }

    let reply = '';
    if (results.length > 0) {
        reply += `✅ Matriculado en: **${results.join(', ')}**\n`;
    }
    if (alreadyEnrolled.length > 0) {
        reply += `⚠️ Ya estabas matriculado en: **${alreadyEnrolled.join(', ')}**\n`;
    }
    if (notFound.length > 0) {
        reply += `❌ No existen: **${notFound.join(', ')}**`;
    }

    message.reply(reply || 'No se realizaron cambios.');
};