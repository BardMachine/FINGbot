const { ChannelType } = require('discord.js');
const { materias, saveMaterias } = require('../utils/data');

module.exports = async (message, args) => {
    // Only administrators
    if (!message.member.permissions.has('Administrator')) {
        return message.reply('❌ Solo administradores.');
    }

    if (!args || args.length < 2) {
        return message.reply('Uso: ^agregarMateria {codigo sin espacios} {nombre completo}\nEj: ^agregarMateria p3 PROGRAMACION 3');
    }

    const rawCode = args[0];
    if (/\s/.test(rawCode)) {
        return message.reply('El código no debe contener espacios. Ej: P3');
    }

    const code = rawCode.toUpperCase();
    const name = args.slice(1).join(' ').toUpperCase();

    // If materia exists, update name
    if (materias[code]) {
        const old = Array.isArray(materias[code]) ? materias[code][0] : materias[code];
        materias[code] = [name, materias[code][1] || ''];
        saveMaterias();
        return message.reply(`✅ Nombre de materia actualizado, de **${old}** a **${name}**`);
    }

    // Create new materia entry: [fullName, forumLink]
    materias[code] = [name, ''];
    saveMaterias();

    // Ensure channel exists (lowercase code as channel name)
    const channelName = code.replace(/\s+/g, '').toLowerCase();
    const existing = message.guild.channels.cache.find(ch => ch.name === channelName);
    if (!existing) {
        try {
            await message.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: '1212036115314376796'
            });
        } catch (err) {
            console.error('Error creating channel:', err);
            // continue even if channel creation fails
        }
    }

    message.reply(`✅ Materia **${name}** agregada como código **${code}**.`);
};
