import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs-extra";

// 1. Cargar materias.json y mapear nombres
const materiasJson = fs.readJsonSync("./materias.json");
const allowedNames = new Set(
  Object.values(materiasJson).map(val => val[0].trim().toUpperCase())
);

function getDayFromX(x) {
  if (x >= 250 && x < 340) return 0; // Lunes
  if (x >= 340 && x < 430) return 1; // Martes
  if (x >= 430 && x < 520) return 2; // Miércoles
  if (x >= 520 && x < 610) return 3; // Jueves
  if (x >= 610 && x < 700) return 4; // Viernes
  return null;
}

function isGroup(str) {
  return /(TEORICO|PRACTICO|TALLER)/i.test(str);
}

function isSubject(str) {
  str = str.replace(/\u00A0/g, " ").trim();
  str = str.replace(/–/g, "-"); 
  return /^\d{4}(?:[_\s][^ -]+)?\s*-\s+.+$/.test(str);
}

async function parseHorarios(pathPDF) {
  const loadingTask = pdfjsLib.getDocument({ url: pathPDF, disableFontFace: true });
  const pdf = await loadingTask.promise;
  const result = {};

  let currentSubject = null;
  let activeGroup = null;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const rows = {};
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (!rows[y]) rows[y] = [];
      rows[y].push({ text: item.str.trim(), x: item.transform[4] });
    }

    const sortedYs = Object.keys(rows).map(Number).sort((a, b) => b - a);

    for (let i = 0; i < sortedYs.length; i++) {
      const y = sortedYs[i];
      const items = rows[y].sort((a, b) => a.x - b.x);
      const lineText = items.map(o => o.text).join(" ").trim();

      // --- 1. Detectar Materia ---
      if (isSubject(lineText)) {
        const dashIndex = lineText.indexOf(" - ");
        let rawName = lineText.slice(dashIndex + 3).trim().split("_")[0].trim();
        
        if (allowedNames.has(rawName.toUpperCase())) {
          currentSubject = rawName;
          activeGroup = null; 
          if (!result[currentSubject]) result[currentSubject] = [];
        } else {
          currentSubject = null;
          activeGroup = null;
        }
        continue;
      }

      if (!currentSubject) continue;

      // --- 2. Sincronización de Grupo (Look-ahead) ---
      // Revisamos si la fila actual O la siguiente contienen una etiqueta de grupo
      let potentialGroupLine = lineText;
      const nextY = sortedYs[i + 1];
      const nextLineText = nextY ? rows[nextY].map(o => o.text).join(" ").trim() : "";

      // Si la fila de abajo tiene el nombre del grupo, lo tomamos de una vez
      // para que las horas de esta fila se asignen correctamente.
      let detectedGroupName = null;
      if (isGroup(lineText)) {
        detectedGroupName = lineText;
      } else if (isGroup(nextLineText)) {
        detectedGroupName = nextLineText;
      }

      if (detectedGroupName) {
        // Solo creamos el grupo si es distinto al que ya tenemos activo
        if (!activeGroup || activeGroup.group !== detectedGroupName) {
          activeGroup = { group: detectedGroupName, classes: [] };
          result[currentSubject].push(activeGroup);
        }
      }

      // --- 3. Extraer Horarios ---
      // Solo procesamos si ya tenemos un grupo al cual asignarle
      if (activeGroup) {
        for (const item of items) {
          const matches = item.text.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/g);
          if (matches) {
            const day = getDayFromX(item.x);
            if (day !== null) {
              matches.forEach(m => {
                const [startStr, endStr] = m.split(" - ");
                const [sh, sm] = startStr.split(":").map(Number);
                const [eh, em] = endStr.split(":").map(Number);
                const startTotal = sh * 60 + sm;

                if (!activeGroup.classes.some(c => c.day === day && c.start === startTotal)) {
                  activeGroup.classes.push({
                    day,
                    start: startTotal,
                    end: eh * 60 + em
                  });
                }
              });
            }
          }
        }
      }
    }
  }
  return result;
}

(async () => {
  const data = await parseHorarios("./horarios/clases.pdf");
  fs.writeFileSync("horarios.json", JSON.stringify(data, null, 2), "utf8");
  console.log("Archivo horarios.json generado con éxito.");
})();