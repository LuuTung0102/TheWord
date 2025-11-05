  const fs = require("fs");
  const PizZip = require("pizzip");
  const Docxtemplater = require("docxtemplater");
  const expressionParser = require("docxtemplater/expressions.js");
  const { getPlaceholders } = require("./placeholder");
  const path = require("path");

  function generateDocx(templatePath, data, outputPath, options = {}) {
    try {
      const content = fs.readFileSync(templatePath);
      const zip = new PizZip(content);
      try {
        if (zip.files['word/document.xml']) {
          let xml = zip.files['word/document.xml'].asText();

          for (let i = 0; i < 5; i++) {
            xml = xml.replace(/\{\{([^}]*)<\/w:t><w:t[^>]*>([^}]*)\}\}/g, '{{$1$2}}');
            xml = xml.replace(/\{\{([^}]*)<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>([^}]*)\}\}/g, '{{$1$2}}');
          }
          
            xml = xml.replace(/\{\{[^}]*<[^>]*>[^}]*\}\}/g, (match) => {
            const textContent = match.replace(/<[^>]*>/g, '').replace(/[{}]/g, '');
            if (textContent.trim() && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(textContent.trim())) {
              return `{{${textContent.trim()}}}`;
            }
            return ''; 
          });
          
          xml = xml.replace(/\}\}+}/g, '}}');
          xml = xml.replace(/\{\{[^a-zA-Z_][^}]*\}\}/g, '');
          xml = xml.replace(/\{\{[^}]*\s+[^}]*\}\}/g, (match) => {
            const content = match.replace(/[{}]/g, '').trim();
            if (content && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(content)) {
              return `{{${content}}}`;
            }
            return '';
          });
          
          if (options && options.phMapping && options.visibleSubgroups) {
            xml = xml.replace(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g, (matchP, contentP) => {
              const placeholderMatches = contentP.match(/\{\{([^}]+)\}\}/g);
              if (!placeholderMatches) return matchP;
              const placeholders = placeholderMatches.map(m => m.replace(/[{}]/g, ''));
              const subgroupsInParagraph = new Set();
              placeholders.forEach(ph => {
                const phDef = options.phMapping[ph];
                if (phDef && phDef.subgroup) {
                  subgroupsInParagraph.add(phDef.subgroup);
                }
              });

              if (subgroupsInParagraph.size === 0) return matchP;
              const shouldRemoveLine = Array.from(subgroupsInParagraph).every(subgroupId => {
                const isVisible = options.visibleSubgroups.has(subgroupId);
                const subgroupPhs = placeholders.filter(ph => {
                  const phDef = options.phMapping[ph];
                  return phDef && phDef.subgroup === subgroupId;
                });
                if (subgroupPhs.length === 0) return false; 
                const allEmpty = subgroupPhs.every(ph => !data[ph] || data[ph].toString().trim() === '');  
                if (!isVisible) {        
                  return allEmpty;
                } else {
                  return false;
                }
              });

              if (shouldRemoveLine) {
                const extractedText = contentP.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
                const lineText = extractedText ? extractedText.map(t => t.replace(/<w:t[^>]*>|<\/w:t>/g, '')).join('').trim() : '';
                return '';
              }
              return matchP;
            });
          }
      
          xml = xml.replace(/(<w:t[^>]*>)([^<]*?)(m2)([^<]*?)(<\/w:t>)/g, (match, openTag, before, m2, after, closeTag) => {
          return `${openTag}${before}m²${after}${closeTag}`;
          });
          zip.file('word/document.xml', xml);
        }
      } catch (err) {
      }

      let doc;
      try {
        doc = new Docxtemplater(zip, {
          parser: expressionParser,
          paragraphLoop: true,
          linebreaks: true,
          nullGetter: () => "", 
          delimiters: { start: "{{", end: "}}" },
          modules: []
        });
      } catch (error) {
        let msg = `❌ Error compiling template ${path.basename(templatePath)}: ${error.message}`;
        if (error.properties && Array.isArray(error.properties.errors)) {
          const details = error.properties.errors.map((e, idx) => {
            const expl = e.explanation || e.message || JSON.stringify(e);
            const context = e.context ? JSON.stringify(e.context, null, 2) : '';
            return `${idx + 1}. ${expl}${context ? '\n   Context: ' + context : ''}`;
          }).join('\n');
          msg += '\n📋 Details:\n' + details;
        }
        throw new Error(msg);
      }
    
      Object.keys(data).forEach(k => {
        if (data[k] === null || data[k] === undefined) data[k] = "";
        else if (typeof data[k] !== 'string') data[k] = String(data[k]);
      });
      if (data.Loai_Dat && data.Loai_Dat.trim()) {
        try {
          const landTypesPath = path.join(__dirname, '..', 'renderer', 'config', 'land_types.json');
          const landTypeMap = JSON.parse(fs.readFileSync(landTypesPath, 'utf8'));
          const expandedNames = data.Loai_Dat
            .split('+')
            .map(s => s.trim().toUpperCase())
            .filter(Boolean)
            .map(code => landTypeMap[code] || code)
            .join(' và ');
          data.Loai_Dat = expandedNames;
        } catch (error) {
        }
      }
      
      if (data.Loai_Dat_F && data.Loai_Dat_F.trim()) {
        try {
          const landTypesPath = path.join(__dirname, '..', 'renderer', 'config', 'land_types.json');
          const landTypeMap = JSON.parse(fs.readFileSync(landTypesPath, 'utf8'));
          let formattedValue = data.Loai_Dat_F;
          const pairs = formattedValue.split(';').map(p => p.trim()).filter(Boolean);
          const formattedPairs = pairs.map(pair => {
            if (pair.includes('m²')) {
              const m2Match = pair.match(/^(\d+(?:\.\d+)?)\s*m²\s*(.+)$/i);
              if (m2Match) {
                const area = m2Match[1];
                const rest = m2Match[2].trim();
                if (/^[A-Z]{2,4}$/.test(rest)) {
                  return `${area}m² ${rest}`;
                } else {
                  const foundCode = Object.keys(landTypeMap).find(code => landTypeMap[code] === rest);
                  if (foundCode) {
                    return `${area}m² ${foundCode}`;
                  }
                  return pair;
                }
              }
              return pair;
            }
            let match = pair.match(/^(\d+(?:\.\d+)?)\s*m2\s*([A-Z]+)$/i);
            if (match) {
              const area = match[1];
              const code = match[2].toUpperCase();
              return `${area}m² ${code}`;
            }
            match = pair.match(/^([A-Z]+)\s+(\d+(?:\.\d+)?)$/i);
            if (match) {
              const code = match[1].toUpperCase();
              const area = match[2];
              return `${area}m² ${code}`;
            }
            match = pair.match(/^(\d+(?:\.\d+)?)\s*m2\s*(.+)$/i);
            if (match) {
              const area = match[1];
              const nameOrCode = match[2].trim();
              if (/^[A-Z]{2,4}$/.test(nameOrCode)) {
                return `${area}m² ${nameOrCode}`;
              } else {
                const foundCode = Object.keys(landTypeMap).find(code => landTypeMap[code] === nameOrCode);
                if (foundCode) {
                  return `${area}m² ${foundCode}`;
                }
              }
            }
            return pair;
          });
          data.Loai_Dat_F = formattedPairs.join('; ');
        } catch (error) {
        }
      }
      
      const templatePhs = getPlaceholders(templatePath);
      const fullData = {};
      templatePhs.forEach(ph => {
        fullData[ph] = data[ph] !== undefined ? data[ph] : '';
      });
      
      // Helper function to convert UPPERCASE to Title Case
      // Example: "LƯU THANH TÙNG" -> "Lưu Thanh Tùng"
      function toTitleCase(str) {
        if (!str || typeof str !== 'string') return str;
        return str
          .toLowerCase()
          .split(' ')
          .map(word => {
            if (word.length === 0) return word;
            // Handle Vietnamese characters properly
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(' ');
      }
      
      // Auto-generate NameT1, NameT2, ... from Name1, Name2, ... if template has NameT placeholders
      templatePhs.forEach(ph => {
        // Check if this is a NameT placeholder (e.g., NameT1, NameT2)
        const nameTMatch = ph.match(/^NameT(\d+)$/);
        if (nameTMatch) {
          const number = nameTMatch[1];
          const baseNamePh = `Name${number}`;
          // Get the value from Name1, Name2, etc.
          const baseValue = data[baseNamePh] || fullData[baseNamePh] || '';
          // Convert to Title Case
          fullData[ph] = toTitleCase(baseValue);
        }
      });
      
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string' && data[key].includes('m2')) {
          data[key] = data[key].replace(/m2/g, 'm²');
         
        }
      });
      Object.keys(fullData).forEach(key => {
        if (typeof fullData[key] === 'string' && fullData[key].includes('m2')) {
          fullData[key] = fullData[key].replace(/m2/g, 'm²');
        }
      });

      try {
        doc.render(fullData);
      } catch (error) {
        let msg = `Error rendering template ${path.basename(templatePath)}: ${error.message}`;
        if (error.properties && Array.isArray(error.properties.errors)) {
          const details = error.properties.errors.map((e, idx) => {
            const expl = e.explanation || e.message || JSON.stringify(e);
            return `${idx + 1}. ${expl}`;
          }).join('\n');
          msg += '\nDetails:\n' + details;
        }
        throw new Error(msg);
      }

      const buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE"
      });
      fs.writeFileSync(outputPath, buffer);
     
      return outputPath;
    } catch (error) {
      
      if (error.properties?.errors) {
        error.properties.errors.forEach(err => console.error("🧩 Chi tiết:", err.explanation));
      }
      throw error;
    }
  }

  module.exports = { generateDocx };