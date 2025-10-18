const fs = require("fs");
const PizZip = require("pizzip");

function getPlaceholders(filePath) {
  try {
    const content = fs.readFileSync(filePath, "binary");
    const zip = new PizZip(content);
  
    const xml = zip.files["word/document.xml"].asText();
    let cleanText = xml.replace(/<[^>]*>/g, "");
    cleanText = cleanText.replace(/\s+/g, " ").trim();
    const regex = /{{(.*?)}}/g;
    let match;
    const placeholders = [];
    while ((match = regex.exec(cleanText)) !== null) {
      const ph = match[1].trim();
      if (ph) placeholders.push(ph);
    }
  
    return [...new Set(placeholders)];
  } catch (error) {
    console.error("❌ Lỗi extract placeholders:", error);
    return [];
  }
}

module.exports = { getPlaceholders };