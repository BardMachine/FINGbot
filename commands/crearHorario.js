const data = require("../horarios.json");
const { materias } = require('../utils/data');

function minutesToHour(min) {
    const h = Math.floor(min / 60);
    return h.toString().padStart(2, "0") + ":00";
}

// ---------------- PARSER ----------------

function parseArgs(args) {
    let timePreferences = { 
        after: null, 
        before: null, 
        prioritizeFewerDays: true // Default
    };
    const subjects = [];

    if (args.length === 0) return { help: true };

    for (const arg of args) {
        // Global Preferences: ( >13, <20, corto )
        if (arg.startsWith("(") && arg.endsWith(")")) {
            const content = arg.slice(1, -1).split(",");
            content.forEach(p => {
                const clean = p.trim().toLowerCase();
                if (clean.startsWith(">")) timePreferences.after = parseInt(clean.slice(1)) * 60;
                if (clean.startsWith("<")) timePreferences.before = parseInt(clean.slice(1)) * 60;
                if (clean === "compacto") timePreferences.prioritizeFewerDays = true;
                if (clean === "corto") timePreferences.prioritizeFewerDays = false;
            });
            continue;
        }

        // Subject Parsing: MATID(exclusions)
        const match = arg.match(/^(\w+)(\((.*?)\))?$/);
        if (match) {
            const id = match[1];
            const exclusionsRaw = match[3] || "";
            const exclude = [];
            if (exclusionsRaw.includes("-t")) exclude.push("teorico");
            if (exclusionsRaw.includes("-p")) exclude.push("practico");
            if (exclusionsRaw.includes("-l")) exclude.push("taller");
            subjects.push({ id, exclude });
        }
    }
    return { timePreferences, subjects };
}

// ------------- COMPONENT EXPANSION -------------

function expandSubjectComponents(subjectName, groupsArray, exclude) {
    const buckets = { teorico: [], practico: [], taller: [] };

    for (const g of groupsArray) {
        const lower = g.group.toLowerCase();
        let type = null;
        if (lower.includes("teorico")) type = "teorico";
        else if (lower.includes("practico")) type = "practico";
        else if (lower.includes("taller")) type = "taller";

        if (!type || exclude.includes(type)) continue;

        if (g.classes && g.classes.length > 0) {
            buckets[type].push({ id: g.group, classes: g.classes });
        }
    }

    const components = [];
    ["teorico", "practico", "taller"].forEach(type => {
        if (buckets[type].length > 0) {
            components.push({ subjectId: subjectName, type: type, groups: buckets[type] });
        }
    });
    return components;
}

// ---------------- SCORE ----------------

function scoreSchedule(schedule, prefs) {
    let score = 0;

    // Penalty for classes outside time bounds
    for (const cls of schedule.classes) {
        if (prefs.after && cls.start < prefs.after) score += 200;
        if (prefs.before && cls.end > prefs.before) score += 200;
    }

    const daysUsed = new Set(schedule.classes.map(c => c.day));
    
    if (prefs.prioritizeFewerDays) {
        // Strategy: Compact (Minimize days)
        score += daysUsed.size * 500;
    } else {
        // Strategy: Short (Minimize daily span/fatigue)
        const dailySpans = {};
        schedule.classes.forEach(cls => {
            if (!dailySpans[cls.day]) dailySpans[cls.day] = { min: 1440, max: 0 };
            dailySpans[cls.day].min = Math.min(dailySpans[cls.day].min, cls.start);
            dailySpans[cls.day].max = Math.max(dailySpans[cls.day].max, cls.end);
        });
        Object.values(dailySpans).forEach(s => {
            score += (s.max - s.min); // Longer days = higher penalty
        });
    }

    return score;
}

// ---------------- CALENDAR RENDER ----------------

function buildCalendar(schedule) {
    const days = ["Lun", "Mar", "Mie", "Jue", "Vie"];
    const start = 8 * 60, end = 22 * 60, step = 30;
    const grid = {};

    for (let d = 0; d < 5; d++) {
        grid[d] = {};
        for (let t = start; t < end; t += step) grid[d][t] = "        ";
    }

    for (const cls of schedule.classes) {
        for (let t = cls.start; t < cls.end; t += 30) {
            if (grid[cls.day] && grid[cls.day][t] !== undefined) {
                let tag = cls.type === "teorico" ? "-T" : cls.type === "practico" ? "-P" : "-L";
                grid[cls.day][t] = (cls.subject.toLowerCase().slice(0, 5) + tag).padEnd(8).slice(0, 8);
            }
        }
    }

    let output = "```\nHora  | " + days.map(d => d.padEnd(8)).join(" | ") + "\n";
    output += "---------------------------------------------------------\n";
    for (let t = start; t < end; t += step) {
        let hLabel = (t % 60 === 0) ? (Math.floor(t / 60).toString().padStart(2, "0") + ":00") : "     ";
        let row = hLabel + " | ";
        for (let d = 0; d < 5; d++) row += grid[d][t] + " | ";
        output += row + "\n";
    }
    return output + "```";
}

// ---------------- MAIN EXPORT ----------------

module.exports = async (message, args) => {
    const parsed = parseArgs(args);

    if (parsed.help) {
        return message.reply({
            embeds: [{
                title: "📅 Generador de Horarios",
                color: 0x3498db,
                description: "Escribe las materias y filtros para encontrar tu horario ideal.",
                fields: [
                    { name: "Sintaxis Materias", value: "`ID`: Todo\n`ID(-t)`: Sin teórico\n`ID(-p)`: Sin práctico", inline: true },
                    { name: "Filtros `(dentro de paréntesis)`", value: "`(>13)`: Inicia después de las 13\n`(<21)`: Termina antes de las 21\n`(compacto)`: Menos días de cursada\n`(corto)`: Jornadas diarias breves", inline: true }
                ],
                footer: { text: "Ej: ^crearHorario AM1 ADS(–p) (>10,corto)" }
            }]
        });
    }

    const { timePreferences, subjects: parsedSubjects } = parsed;
    const subjectData = [];

    for (const s of parsedSubjects) {
        const materia = materias[s.id.toUpperCase()];
        if (!materia) continue;
        const name = materia[0];
        const found = data[name];
        if (!found) continue;

        subjectData.push({
            id: s.id,
            components: expandSubjectComponents(name, found, s.exclude)
        });
    }

    if (subjectData.length === 0) return message.reply("Materias no encontradas.");

    const validSchedules = [];
    function overlaps(a, b) { return a.day === b.day && a.start < b.end && b.start < a.end; }

    function backtrack(sIdx, cIdx, chosenGroups, scheduleClasses) {
        if (sIdx === subjectData.length) {
            validSchedules.push({ groups: [...chosenGroups], classes: [...scheduleClasses] });
            return;
        }
        const subject = subjectData[sIdx];
        if (cIdx === subject.components.length) {
            backtrack(sIdx + 1, 0, chosenGroups, scheduleClasses);
            return;
        }

        const component = subject.components[cIdx];
        for (const group of component.groups) {
            const conflict = group.classes.some(cls => scheduleClasses.some(ex => overlaps(cls, ex)));
            if (!conflict) {
                const enriched = group.classes.map(c => ({ ...c, subject: subject.id, type: component.type }));
                chosenGroups.push({ subject: subject.id, type: component.type, group: group.id });
                backtrack(sIdx, cIdx + 1, chosenGroups, [...scheduleClasses, ...enriched]);
                chosenGroups.pop();
            }
        }
    }

    backtrack(0, 0, [], []);

    if (validSchedules.length === 0) return message.reply("No hay combinaciones posibles sin choques.");

    validSchedules.forEach(s => s.score = scoreSchedule(s, timePreferences));
    validSchedules.sort((a, b) => a.score - b.score);

    const options = validSchedules.slice(0, 5);
    let index = 0;

    const buildResponse = (i) => `**Opción ${i + 1}/${options.length}** (Score: ${options[i].score})\n` + buildCalendar(options[i]);

    const sentMessage = await message.reply(buildResponse(index));
    if (options.length <= 1) return;

    await sentMessage.react("⬅️");
    await sentMessage.react("➡️");

    const collector = sentMessage.createReactionCollector({
        filter: (r, u) => ["⬅️", "➡️"].includes(r.emoji.name) && u.id === message.author.id,
        time: 60000
    });

    collector.on("collect", async (reaction, user) => {
        index = reaction.emoji.name === "➡️" ? (index + 1) % options.length : (index - 1 + options.length) % options.length;
        await sentMessage.edit(buildResponse(index));
        await reaction.users.remove(user.id);
    });

    collector.on("end", () => sentMessage.reactions.removeAll().catch(() => {}));
};