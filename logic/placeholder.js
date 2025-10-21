const fs = require("fs");
const PizZip = require("pizzip");

function getPlaceholders(filePath) {
  try {
    const content = fs.readFileSync(filePath, "binary");
    const zip = new PizZip(content);
  
    const xml = zip.files["word/document.xml"].asText();
    
    // First, clean up broken placeholders in XML
    let cleanedXml = xml;
    
    // Fix placeholders that contain XML tags
    cleanedXml = cleanedXml.replace(/\{\{[^}]*<[^>]*>[^}]*\}\}/g, (match) => {
      // Extract text content from XML tags
      const textContent = match.replace(/<[^>]*>/g, '').replace(/[{}]/g, '');
      // Only return if it's a valid placeholder
      if (textContent.trim() && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(textContent.trim())) {
        return `{{${textContent.trim()}}}`;
      }
      return ''; // Remove invalid placeholders
    });
    
    // Now extract placeholders from cleaned XML
    let cleanText = cleanedXml.replace(/<[^>]*>/g, "");
    cleanText = cleanText.replace(/\s+/g, " ").trim();
    const regex = /{{(.*?)}}/g;
    let match;
    const placeholders = [];
    while ((match = regex.exec(cleanText)) !== null) {
      const ph = match[1].trim();
      // Include valid placeholders: single letter (like S) or multi-char starting with letter/underscore
      if (ph && (ph.length === 1 || /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ph))) {
        placeholders.push(ph);
      } else if (ph) {
        console.warn(`⚠️ Bỏ qua placeholder không hợp lệ: {{${ph}}}`);
      }
    }
  
    return [...new Set(placeholders)];
  } catch (error) {
    console.error("❌ Lỗi extract placeholders:", error);
    return [];
  }
}

module.exports = { getPlaceholders };