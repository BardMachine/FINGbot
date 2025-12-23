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
        message.reply("Uso: ^desmatricularse {CODIGO} [{CODIGO2} {CODIGO3} ...]\nEjemplo: ^desmatricularse P3 P5");
        return;
    }

    const codigos = args.map(c => c.toUpperCase());
    const usuarios = loadUsuarios();
    const userId = message.author.id;

    if (!usuarios[userId] || !usuarios[userId].materias || usuarios[userId].materias.length === 0) {
        message.reply('No estás matriculado en ninguna materia.');
        return;
    }

    const results = [];
    const notEnrolled = [];

    for (const codigo of codigos) {
        if (usuarios[userId].materias.includes(codigo)) {
            usuarios[userId].materias = usuarios[userId].materias.filter(m => m !== codigo);
            results.push(codigo);
        } else {
            notEnrolled.push(codigo);
        }
    }

    if (results.length > 0) {
        saveUsuarios(usuarios);
    }

    let reply = '';
    if (results.length > 0) {
        reply += `✅ Desmatriculado de: **${results.join(', ')}**\n`;
    }
    if (notEnrolled.length > 0) {
        reply += `⚠️ No estabas matriculado en: **${notEnrolled.join(', ')}**`;
    }

    message.reply(reply || 'No se realizaron cambios.');
};