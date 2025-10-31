const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const expressionParser = require("docxtemplater/expressions.js");
const { getPlaceholders } = require("./placeholder");
const path = require("path");

function generateDocx(templatePath, data, outputPath) {
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
        
        // Sub-step 1c: Clean remaining broken placeholders
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
        
        // ✅ Xóa các dòng chứa TOÀN BỘ placeholders trống của MEN2-6
        xml = xml.replace(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g, (matchP, contentP) => {
          // Extract tất cả placeholders trong paragraph
          const placeholderMatches = contentP.match(/\{\{([^}]+)\}\}/g);
          if (!placeholderMatches) return matchP;

          const placeholders = placeholderMatches.map(m => m.replace(/[{}]/g, ''));
          
          // Lấy các số MEN trong paragraph (1, 2, 3, 4, 5, 6)
          const menNumbers = placeholders
            .map(ph => ph.match(/\d+$/)?.[0])
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i); // unique

          if (menNumbers.length === 0) return matchP;

          // Kiểm tra xem TẤT CẢ các MEN trong dòng có trống không
          const allMenEmpty = menNumbers.every(num => {
            const menKey = `MEN${num}`;
            // MEN2-6 mà KHÔNG có trong data hoặc tất cả fields đều trống
            return num >= 2 && num <= 6 && (
              !data[`Name${num}`] && 
              !data[`Gender${num}`] && 
              !data[`Date${num}`] &&
              !data[`CCCD${num}`]
            );
          });

          if (allMenEmpty) {
            const extractedText = contentP.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
            const lineText = extractedText ? extractedText.map(t => t.replace(/<w:t[^>]*>|<\/w:t>/g, '')).join('').trim() : '';
            console.log(`🗑️ Removing empty MEN line: "${lineText}"`);
            return '';
          }

          return matchP;
        });
        
        zip.file('word/document.xml', xml);
        console.log('✅ Đã làm sạch XML của template');
      }
    } catch (err) {
      console.warn('⚠️ Warning: unable to preprocess document.xml:', err.message || err);
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
      console.error(msg);
      console.error('📄 Template path:', templatePath);
      console.error('🔍 Error stack:', error.stack);
      throw new Error(msg);
    }
    // ✅ FATHER/MOTHER và MEN logic đã được thay thế bằng pre-processing XML

    
    // Normalize data values
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
        console.log(`✅ Expanded Loai_Dat: ${expandedNames}`);
      } catch (error) {
        console.warn('⚠️ Could not expand Loai_Dat:', error.message);
      }
    }
    // ✅ Get all placeholders from template and ensure they all have values
    const templatePhs = getPlaceholders(templatePath);
    const fullData = {};
    templatePhs.forEach(ph => {
      fullData[ph] = data[ph] !== undefined ? data[ph] : '';
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
      console.error(msg);
      throw new Error(msg);
    }

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE"
    });
    fs.writeFileSync(outputPath, buffer);

    console.log("✅ Đã tạo file Word:", outputPath);
    return outputPath;
  } catch (error) {
    console.error("❌ Lỗi khi tạo file Word cho", path.basename(templatePath) + ":", error);
    if (error.properties?.errors) {
      error.properties.errors.forEach(err => console.error("🧩 Chi tiết:", err.explanation));
    }
    throw error;
  }
}

module.exports = { generateDocx };