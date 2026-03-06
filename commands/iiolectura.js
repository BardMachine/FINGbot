const fs = require('fs');
const { getCurrentWeek, getWeek } = require('../utils/weeks');

module.exports = async (message, args) => {

    let current;

    if (args.length > 0) {
        current = getWeek("week" + args[0]);
    } else {
        current = getCurrentWeek();
    }

    if (!current) {
        console.log("No active week right now.");
        return;
    }

    console.log(`📘 ${current.weekName} (${current.start}–${current.end})`);

    const reply =
        `📘 **Semana ${current.weekName.slice(4)}**\n` +
        `📄 Páginas: ${current.pageStart}–${current.pageEnd}`;

    await message.reply(reply);

    const filepath = `./weeks/${current.weekName}.pdf`;

    if (fs.existsSync(filepath)) {
        await message.reply({ files: [filepath] });
    } else {
        await message.reply("⚠️ El PDF de esta semana no está disponible.");
    }

};