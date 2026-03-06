// partitionCourse.js
import fs from "fs-extra";
import { PDFDocument } from "pdf-lib";

async function main() {
  const inputPdfPath = "./course.pdf";
  const weeksJsonPath = "./weeks.json";
  const outputDir = "./weeks";

  await fs.ensureDir(outputDir);

  const weeks = JSON.parse(await fs.readFile(weeksJsonPath, "utf8"));
  const pdfBytes = await fs.readFile(inputPdfPath);
  const masterPdf = await PDFDocument.load(pdfBytes);

  for (const [weekName, range] of Object.entries(weeks)) {
    const { start, end } = range;

    console.log(`\n📚 Processing ${weekName} (${start} → ${end})`);

    if (typeof start !== "number" || typeof end !== "number") {
      console.warn(`⚠️ Invalid range for ${weekName}, skipping...`);
      continue;
    }

    if (end < start) {
      console.warn(`⚠️ End before start for ${weekName}, skipping...`);
      continue;
    }

    const newPdf = await PDFDocument.create();

    const pageIndices = Array.from(
      { length: end - start + 1 },
      (_, i) => start - 1 + i
    );

    try {
      const pagesToCopy = await newPdf.copyPages(masterPdf, pageIndices);
      pagesToCopy.forEach((p) => newPdf.addPage(p));

      const newPdfBytes = await newPdf.save();
      const outputFile = `${outputDir}/${weekName}.pdf`;

      await fs.writeFile(outputFile, newPdfBytes);

      console.log(`✅ Saved ${outputFile} (${pagesToCopy.length} pages)`);
    } catch (err) {
      console.error(`❌ Error processing ${weekName}:`, err.message);
    }
  }

  console.log("\n🎉 All weeks processed successfully!");
}

main().catch((err) => console.error("💥 Fatal error:", err));