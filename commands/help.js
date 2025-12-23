module.exports = async (message) => {
    const helpLines = [
        "**📖 Comandos disponibles**",
        "",
        "- **`^examenes {CODIGO}`**: Muestra la fecha y hora del próximo examen de la materia.",
        "  - Ej: `^examenes P3`",
        "",
        "- **`^parciales {CODIGO}`**: Muestra la fecha y hora del próximo parcial de la materia.",
        "  - Ej: `^parciales P3`",
        "",
        "- **`^matricularse {CODIGO}`**: Guarda la materia en tu lista personal (no asigna roles). Solo acepta códigos existentes en `materias.json`.",
        "  - Ej: `^matricularse P3`",
        "",
        "- **`^desmatricularse {CODIGO}`**: Elimina una materia de tu lista personal.",
        "  - Ej: `^desmatricularse P3`",
        "",
        "- **`^calendario`**: Muestra un calendario compacto con los parciales de tus materias.",
        "",
        "- **`^novedades`**: Comprueba novedades del foro para el canal actual.",
        "",
        "- **`^p3lectura {N}`**: Envía el PDF de la semana (opcional N).",
        "",
        "---",
        "**⚙️ Comandos de administrador**",
        "",
        "- **`^agregarMateria {CODIGO} {NOMBRE}`**: Crea o actualiza una materia en `materias.json` y crea el canal (código sin espacios).",
        "  - Ej: `^agregarMateria p3 PROGRAMACION 3`",
        "",
        "- **`^agregarForo {CODIGO} {URL}`**: Asocia o actualiza el link al foro de EVA para la materia.",
        "  - Ej: `^agregarForo P3 https://eva.fing.edu.uy/mod/forum/view.php?id=XXXXX`",
        "",
        "- **`^subirExamenes`** / **`^subirParciales`**: Adjunta un PDF al mensaje para actualizar los horarios.",
        "",
        "Pistas: Las materias válidas están en `materias.json`. Usa `^matricularse {CODIGO}` para agregarlas a tu lista personal y luego `^calendario` para ver los parciales."
    ].join('\n');

    message.reply(helpLines);
};