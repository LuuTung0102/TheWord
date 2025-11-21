const fs = require("fs");
const PizZip = require("pizzip");

function getPlaceholders(filePath) {
  try {
    const content = fs.readFileSync(filePath, "binary");
    const zip = new PizZip(content);
    const xml = zip.files["word/document.xml"].asText();
    let cleanedXml = xml;
    cleanedXml = cleanedXml.replace(/\{\{[^}]*<[^>]*>[^}]*\}\}/g, (match) => {
      const textContent = match.replace(/<[^>]*>/g, '').replace(/[{}]/g, '');
      if (textContent.trim() && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(textContent.trim())) {
        return `{{${textContent.trim()}}}`;
      }
      return ''; 
    });
    let cleanText = cleanedXml.replace(/<[^>]*>/g, "");
    cleanText = cleanText.replace(/\s+/g, " ").trim();
    const regex = /{{(.*?)}}/g;
    let match;
    const placeholders = [];
    while ((match = regex.exec(cleanText)) !== null) {
      const ph = match[1].trim();
      if (ph && (ph.length === 1 || /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ph))) {
        placeholders.push(ph);
      } else if (ph) {
      }
    }
  
    return [...new Set(placeholders)];
  } catch (error) {
    return [];
  }
}

module.exports = { getPlaceholders };