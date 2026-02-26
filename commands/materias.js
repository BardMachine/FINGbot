const fs = require('fs');
const path = require('path');
const { materias, fechasParciales } = require('../utils/data');

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


module.exports = async (message) => {
    const usuarios = loadUsuarios();
    const userId = message.author.id;

    if (!usuarios[userId] || !usuarios[userId].materias || usuarios[userId].materias.length === 0) {
        message.reply("No estás matriculado en ninguna materia. Usa ^matricularse {CODIGO} para agregar materias.");
        return;
    }
    var response = "Tus materias matriculadas son:\n";
    usuarios[userId].materias.forEach(codigo => {
        const materia = materias.find(m => m.codigo === codigo);
        if (materia) {
            response += `- ${materia.nombre} (${materia.codigo})\n`;
        }
    });
    message.reply(response);
    
}