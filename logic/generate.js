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
        // Only do basic cleanup to avoid breaking the document structure
        xml = xml.replace(/<\/w:t>\s*<\/w:r>\s*<w:r[^>]*>\s*<w:t[^>]*>/g, '');
        xml = xml.replace(/\}\}+}/g, '}}');
        
        zip.file('word/document.xml', xml);
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
        nullGetter: () => "", // Trả về chuỗi rỗng thay vì giữ placeholder
        delimiters: { start: "{{", end: "}}" },
        modules: []
      });
    } catch (error) {
      let msg = `Error compiling template ${path.basename(templatePath)}: ${error.message}`;
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
    const templatePhs = getPlaceholders(templatePath);
  
    const menGroupsToCheck = ['MEN3', 'MEN4', 'MEN5', 'MEN6'];
    const menPlaceholders = {
      'MEN3': ['Gender3', 'Name3', 'CCCD3', 'Date3', 'Noi_Cap3', 'Ngay_Cap3'],
      'MEN4': ['Gender4', 'Name4', 'CCCD4', 'Date4', 'Noi_Cap4', 'Ngay_Cap4'],
      'MEN5': ['Gender5', 'Name5', 'CCCD5', 'Date5', 'Noi_Cap5', 'Ngay_Cap5'],
      'MEN6': ['Gender6', 'Name6', 'CCCD6', 'Date6', 'Noi_Cap6', 'Ngay_Cap6']
    };

    // Check if any MEN3-MEN6 group should be completely removed
    menGroupsToCheck.forEach(group => {
      const placeholders = menPlaceholders[group];
      const hasAnyData = placeholders.some(ph => {
        const value = data[ph];
        return value && value.trim() !== "";
      });

      if (!hasAnyData) {
        placeholders.forEach(ph => {
          data[ph] = "";
        });
        data[`${group}_EMPTY`] = true;
        
        // Đánh dấu để xóa hoàn toàn với marker đặc biệt
        const index = group.replace('MEN', '');
        data[`MEN${index}_L1`] = "___DELETE_THIS___";  // Marker đặc biệt cho xóa dòng
        data[`MEN${index}_L1_Before`] = "___DELETE_THIS___";
        data[`MEN${index}_L1_Name`] = "";
        data[`MEN${index}_L1_After`] = "";
        data[`MEN${index}_L2`] = "___DELETE_THIS___";
        
        console.log(`🗑️ Removed empty group: ${group}`);
      } else {
        data[`${group}_EMPTY`] = false;
      }
    });

    // Set empty string for any template placeholders not in data
    templatePhs.forEach(ph => {
      if (!(ph in data)) data[ph] = "";
    });

    // Xử lý dữ liệu BD từ nguồn đã chọn
    if (data.selectedBDDataSource) {
      const source = data.selectedBDDataSource;
      // Dùng mapping tập trung từ renderer/bdMapping.js
      let mapping;
      try {
        // Try require when available (in main process)
        const bdMap = require(path.join(__dirname, '..', 'renderer', 'bdMapping.js'));
        mapping = bdMap && bdMap[source];
      } catch (e) {
        // Fallback: minimal inline mapping if require fails
        const fallback = {
          MEN1: { BD_Gender: 'Gender1', BD_Name: 'Name1', BD_CCCD: 'CCCD1', BD_Date: 'Date1', BD_Noi_Cap: 'Noi_Cap1', BD_Ngay_Cap: 'Ngay_Cap1', BD_SDT: 'SDT_MEN1', BD_Address: 'Address1', BD_Email: 'EMAIL_MEN1' },
          MEN7: { BD_Gender: 'Gender7', BD_Name: 'Name7', BD_CCCD: 'CCCD7', BD_Date: 'Date7', BD_Noi_Cap: 'Noi_Cap7', BD_Ngay_Cap: 'Ngay_Cap7', BD_SDT: 'SDT_MEN7', BD_Address: 'Address2', BD_Email: 'EMAIL_MEN7' },
        };
        mapping = fallback[source];
      }
      if (mapping) {
        // Điền dữ liệu từ nguồn vào các trường BD
        Object.entries(mapping).forEach(([bdField, sourceField]) => {
          if (data[sourceField] && data[sourceField].trim()) {
            data[bdField] = data[sourceField];
            console.log(`✅ BD: ${bdField} = ${data[sourceField]} (từ ${sourceField})`);
          } else {
            console.log(`⚠️ BD: ${bdField} = "" (không có dữ liệu từ ${sourceField})`);
          }
        });
      }
    } else {
      console.log("⚠️ Không có nguồn dữ liệu BD được chọn");
    }
    
    // Normalize data values
    Object.keys(data).forEach(k => {
      if (data[k] === null || data[k] === undefined) data[k] = "";
      else if (typeof data[k] !== 'string') data[k] = String(data[k]);
    });

    const buildMenLines = (index) => {
     
      if (data[`MEN${index}_EMPTY`] === true) {
        return;
      }
      
      const gender = (data[`Gender${index}`] || "").trim();
      const name = (data[`Name${index}`] || "").trim();
      const birthDate = (data[`Date${index}`] || "").trim();
      const cccd = (data[`CCCD${index}`] || "").trim();
      const issuingPlace = (data[`Noi_Cap${index}`] || "").trim();
      const issuingDate = (data[`Ngay_Cap${index}`] || "").trim();

      const hasAny = [gender, name, birthDate, cccd, issuingPlace, issuingDate]
        .some(v => v && v.length > 0);

      if (!hasAny) {
       
        data[`MEN${index}_L1`] = "___DELETE_THIS___";
        data[`MEN${index}_L1_Before`] = "___DELETE_THIS___";
        data[`MEN${index}_L1_Name`] = "";
        data[`MEN${index}_L1_After`] = "";
        data[`MEN${index}_L2`] = "___DELETE_THIS___";
        return;
      }

      data[`MEN${index}_L1_Before`] = gender ? `${gender} ` : "";
    
      data[`MEN${index}_L1_Name`] = name;
      
      data[`MEN${index}_L1_After`] = birthDate ? ` sinh ngày: ${birthDate}` : "";

      const line1Parts = [];
      const fullName = `${gender} ${name}`.trim();
      if (fullName) line1Parts.push(fullName);
      if (birthDate) line1Parts.push(`sinh ngày: ${birthDate}`);
      data[`MEN${index}_L1`] = line1Parts.join(" ");

      const line2Segments = [];
      if (cccd) line2Segments.push(`CCCD số: ${cccd}`);
      if (issuingPlace) line2Segments.push(`do ${issuingPlace}`);
      if (issuingDate) line2Segments.push(`ngày ${issuingDate}`);
      data[`MEN${index}_L2`] = line2Segments.join(", ");
    };

    [3, 4, 5, 6].forEach(buildMenLines);

    try {
      doc.render(data);
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

    try {
      const renderedZip = doc.getZip();
      if (renderedZip.files['word/document.xml']) {
        let xml = renderedZip.files['word/document.xml'].asText();

        xml = xml.replace(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g, (match, content) => {

          const textMatches = content.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
          if (!textMatches) return match; 
          

          const allText = textMatches
            .map(t => t.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
            .join('')
            .trim();
        
          if (allText === '' || allText.includes('___DELETE_THIS___')) {
            return '';
          }
          
          // Nếu có text thực khác -> giữ nguyên
          return match;
        });
        
        renderedZip.file('word/document.xml', xml);
      }
    } catch (err) {
      console.warn('⚠️ Warning: unable to process document.xml:', err.message || err);
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