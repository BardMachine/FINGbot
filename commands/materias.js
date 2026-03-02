const fs = require('fs');
const path = require('path');
const { materias, fechasParciales } = require('../utils/data');
const { debug } = require('console');

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


module.exports = async (message, args) => {
    const usuarios = loadUsuarios();
    const userId = message.author.id;

    if (!usuarios[userId] || !usuarios[userId].materias || usuarios[userId].materias.length === 0) {
        message.reply("No estás matriculado en ninguna materia. Usa ^matricularse {CODIGO} para agregar materias.");
        return;
    }
    var response = "**📚 Tus materias matriculadas:**\n\n";

usuarios[userId].materias.forEach(codigo => {
    const materia = materias[codigo];
    if (materia) {
        if (materia[1]) {
            var url = materia[1].toString();
            if(!materia[1].toString().startsWith("http")){
                url = "https://" + materia[1].toString();
            }
    response += `• **[${materia[0]}](${url})**\n\`${codigo}\`\n\n`;
} else {
    response += `• **${materia[0]}**\n\`${codigo}\`\n\n`;
}
    }
});
    message.reply(response);
    
}