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
        // ✅ Step 1: Clean placeholders broken by XML formatting
        // Word thường split placeholders do user format (bold/italic/etc) một phần của placeholder
        // Ví dụ: {{So</w:t><w:t xml:space="preserve">_so}} → {{So_so}}
        
        // ❌ DISABLED: Sub-step 1a - Xóa tags chứa whitespace
        // Problem: Template có "<w:t>:</w:t><w:t> </w:t><w:t>Name</w:t>"
        //          → Xóa mất space → ":<w:t>Name</w:t>" → ":Name" (không có khoảng trắng)
        // Solution: KHÔNG xóa whitespace, để docxtemplater và Word xử lý
        // xml = xml.replace(/<w:t[^>]*>\s*<\/w:t>/g, '');
        
        // Sub-step 1b: Fix placeholders split by tags (multiple passes to handle nesting)
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
        
        // ❌ KHÔNG merge các <w:r> hoặc <w:t> tags khác nhau
        // Lý do: Giữa các tags có thể có TEXT CONTENT quan trọng
        // Ví dụ: <w:t>{{QSH}}</w:t></w:r><w:r><w:t>, vào sổ số: </w:t>
        //        ↑ KHÔNG được xóa ", vào sổ số: "!
        
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

    const landParts = [];
    Object.keys(data).forEach(key => {
      if (key.startsWith('S_') && key !== 'S_Text' && key !== 'S_Chung') {
        const value = data[key];
        if (value && value.toString().trim() !== "" && value !== "0") {
          const landCode = key.replace('S_', '');
          landParts.push(`${value}m²: ${landCode}`);
      } else {
          data[key] = "";  
        }
      }
    });
    

    data.Loai_Dat_Full = landParts.join('; ');
    
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

    // ✅ Post-processing: Xóa từ nối dư ("và", dấu phẩy) khi placeholders trống
    // ⚠️ CHÚ Ý: Chỉ xóa các pattern cụ thể, KHÔNG xóa tất cả dấu phẩy!
    try {
      let xml = zip.files['word/document.xml'].asText();
      
      // ❌ DISABLED: Các regex này đang xóa cả dấu phẩy hợp lệ trong nội dung
      // Ví dụ: "số: sad, vào sổ số: 8987, được UBND" → "số: sadvào sổ số: 8987được UBND"
      
      // Chỉ xóa các pattern SAU KHI placeholder đã được thay thế
      // Pattern 1: Xóa ", và" khi cả 2 đều có (dư thừa)
      xml = xml.replace(/,\s*và\s*,/g, ', ');
      
      // Pattern 2: Xóa "và ," (sai thứ tự)
      xml = xml.replace(/và\s*,/g, 'và');
      
      // Pattern 3: Xóa ", và" ở cuối câu (trước dấu chấm/xuống dòng)
      xml = xml.replace(/,\s*và\s*(?=\.|\?|\!|<\/w:p>|<w:br)/g, '');
      
      // Pattern 4: Xóa "và" đơn độc ở cuối câu
      xml = xml.replace(/\s+và\s*(?=\.|\?|\!|<\/w:p>|<w:br)/g, '');
      
      // Pattern 5: Xóa dấu phẩy kép ", ,"
      xml = xml.replace(/,\s*,+/g, ',');
      
      // Pattern 6: Xóa nhiều khoảng trắng liên tiếp
      xml = xml.replace(/(<w:t[^>]*>)(\s{3,})/g, '$1 ');
      
      zip.file('word/document.xml', xml);
      console.log('✅ Post-processing: Cleaned up conjunctions (safe mode)');
    } catch (err) {
      console.warn('⚠️ Could not clean up conjunctions:', err.message);
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