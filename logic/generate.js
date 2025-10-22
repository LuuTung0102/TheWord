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
        xml = xml.replace(/\{\{[^}]*<[^>]*>[^}]*\}\}/g, (match) => {
          const textContent = match.replace(/<[^>]*>/g, '').replace(/[{}]/g, '');
          if (textContent.trim() && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(textContent.trim())) {
            return `{{${textContent.trim()}}}`;
          }
          return ''; 
        });
        xml = xml.replace(/<\/w:t>\s*<\/w:r>\s*<w:r[^>]*>\s*<w:t[^>]*>/g, '');
        xml = xml.replace(/\}\}+}/g, '}}');
        xml = xml.replace(/\{\{[^a-zA-Z_][^}]*\}\}/g, '');
        xml = xml.replace(/\{\{[^}]*\s+[^}]*\}\}/g, (match) => {
          const content = match.replace(/[{}]/g, '').trim();
          if (content && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(content)) {
            return `{{${content}}}`;
          }
          return '';
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
  
    // Use shared constants
    const menGroupsToCheck = ['MEN3', 'MEN4', 'MEN5', 'MEN6'];
    const menPlaceholders = {
      'MEN3': ['Gender3', 'Name3', 'CCCD3', 'Date3', 'Noi_Cap3', 'Ngay_Cap3'],
      'MEN4': ['Gender4', 'Name4', 'CCCD4', 'Date4', 'Noi_Cap4', 'Ngay_Cap4'],
      'MEN5': ['Gender5', 'Name5', 'CCCD5', 'Date5', 'Noi_Cap5', 'Ngay_Cap5'],
      'MEN6': ['Gender6', 'Name6', 'CCCD6', 'Date6', 'Noi_Cap6', 'Ngay_Cap6']
    };

    menGroupsToCheck.forEach(group => {
      const placeholders = menPlaceholders[group] || [];
      const hasAnyData = placeholders.some(ph => {
        const value = data[ph];
        return value && value.trim() !== "";
      });

      if (!hasAnyData) {
        placeholders.forEach(ph => {
          data[ph] = "";
        });
        data[`${group}_EMPTY`] = true;

        const index = group.replace('MEN', '');
        data[`MEN${index}_L1`] = "___DELETE_THIS___"; 
        data[`MEN${index}_L1_Before`] = "___DELETE_THIS___";
        data[`MEN${index}_L1_Name`] = "";
        data[`MEN${index}_L1_After`] = "";
        data[`MEN${index}_L2`] = "___DELETE_THIS___";
        
        console.log(`🗑️ Removed empty group: ${group}`);
      } else {
        data[`${group}_EMPTY`] = false;
      }
    });
    templatePhs.forEach(ph => {
      if (ph.length === 0 || (ph.length > 1 && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ph))) {
        console.warn(`⚠️ Bỏ qua placeholder không hợp lệ: ${ph}`);
        return;
      }
      if (!(ph in data)) data[ph] = "";
    });
    if (data.selectedBDDataSource) {
      const source = data.selectedBDDataSource;
      let mapping;
      try {
        // Try require when available (in main process)
        const bdMapModule = require(path.join(__dirname, '..', 'renderer', 'bdMapping.js'));
        mapping = bdMapModule && bdMapModule[source];
      } catch (e) {
        console.log('⚠️ Could not load bdMapping module, using fallback');
      }
      // Use fallback if require failed
      if (!mapping) {
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
    
    // Handle UQ data source (Ủy quyền - Bên A)
    if (data.selectedUQDataSource) {
      const source = data.selectedUQDataSource;
      let mapping;
      try {
        const uqMapModule = require(path.join(__dirname, '..', 'renderer', 'uqMapping.js'));
        mapping = uqMapModule && uqMapModule[source];
      } catch (e) {
        console.log('⚠️ Could not load uqMapping module, using fallback');
      }
      // Use fallback if require failed
      if (!mapping) {
        const fallback = {
          MEN1: { UQA_Gender: 'Gender1', UQA_Name: 'Name1', UQA_CCCD: 'CCCD1', UQA_Date: 'Date1', UQA_Noi_Cap: 'Noi_Cap1', UQA_Ngay_Cap: 'Ngay_Cap1', UQA_Address: 'Address1' },
          MEN7: { UQA_Gender: 'Gender7', UQA_Name: 'Name7', UQA_CCCD: 'CCCD7', UQA_Date: 'Date7', UQA_Noi_Cap: 'Noi_Cap7', UQA_Ngay_Cap: 'Ngay_Cap7', UQA_Address: 'Address2' },
        };
        mapping = fallback[source];
      }
      if (mapping) {
        // Điền dữ liệu từ nguồn vào các trường UQA (Bên A - người ủy quyền)
        Object.entries(mapping).forEach(([uqaField, sourceField]) => {
          const sourceValue = data[sourceField];
          if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
            // Convert to string and check if not empty after trimming
            const stringValue = String(sourceValue).trim();
            if (stringValue) {
              data[uqaField] = data[sourceField]; // Keep original format (with ":" if exists)
              console.log(`✅ UQ Bên A: ${uqaField} = ${data[sourceField]} (từ ${sourceField})`);
            } else {
              console.log(`⚠️ UQ Bên A: ${uqaField} = "" (dữ liệu rỗng từ ${sourceField})`);
            }
          } else {
            console.log(`⚠️ UQ Bên A: ${uqaField} = "" (không có dữ liệu từ ${sourceField})`);
          }
        });
      }
    } else {
      console.log("⚠️ Không có nguồn dữ liệu UQ được chọn");
    }
    
    // Handle UQ Bên B data source (Người được ủy quyền)
    if (data.selectedUQBenBDataSource) {
      const source = data.selectedUQBenBDataSource;
      
      // Kiểm tra xem có phải là DEFAULT1/2/3 không
      if (source.startsWith('DEFAULT')) {
        // Lấy dữ liệu từ defaultPeople được gửi từ frontend
        const index = parseInt(source.replace('DEFAULT', '')) - 1;
        
        const defaultPeopleData = {
          gender: data[`DEFAULT${index + 1}_gender`] || '',
          name: data[`DEFAULT${index + 1}_name`] || '',
          cccd: data[`DEFAULT${index + 1}_cccd`] || '',
          date: data[`DEFAULT${index + 1}_date`] || '',
          noiCap: data[`DEFAULT${index + 1}_noiCap`] || '',
          ngayCap: data[`DEFAULT${index + 1}_ngayCap`] || '',
          address: data[`DEFAULT${index + 1}_address`] || ''
        };
        
        // Điền dữ liệu vào các trường UQ_*
        if (defaultPeopleData.gender) {
          data.UQ_Gender = defaultPeopleData.gender + ':';
        }
        if (defaultPeopleData.name) {
          data.UQ_Name = defaultPeopleData.name;
        }
        if (defaultPeopleData.cccd) {
          const digits = defaultPeopleData.cccd.replace(/\D/g, '');
          if (digits.length === 12) {
            data.UQ_CCCD = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}.${digits.slice(9, 12)}`;
          }
        }
        if (defaultPeopleData.date) {
          data.UQ_Date = defaultPeopleData.date;
        }
        if (defaultPeopleData.noiCap) {
          data.UQ_Noi_Cap = defaultPeopleData.noiCap;
        }
        if (defaultPeopleData.ngayCap) {
          data.UQ_Ngay_Cap = defaultPeopleData.ngayCap;
        }
        if (defaultPeopleData.address) {
          data.UQ_Address = defaultPeopleData.address;
        }
        
        console.log(`✅ UQ Bên B: Đã điền dữ liệu từ ${source} (${defaultPeopleData.name || 'Chưa có tên'})`);
      } else {
        // Logic cũ cho MEN1/MEN2/MEN7
        let mapping;
        try {
          // Try to load from global first (set by uqMapping.js)
          if (typeof global !== 'undefined' && global.UQ_BENB_FIELD_MAPPINGS) {
            mapping = global.UQ_BENB_FIELD_MAPPINGS[source];
          }
        } catch (e) {
          console.log('⚠️ Could not load UQ_BENB_FIELD_MAPPINGS from global, using fallback');
        }
        // Use fallback if not found
        if (!mapping) {
          const fallback = {
            MEN1: { UQ_Gender: 'Gender1', UQ_Name: 'Name1', UQ_CCCD: 'CCCD1', UQ_Date: 'Date1', UQ_Noi_Cap: 'Noi_Cap1', UQ_Ngay_Cap: 'Ngay_Cap1', UQ_Address: 'Address1' },
            MEN2: { UQ_Gender: 'Gender2', UQ_Name: 'Name2', UQ_CCCD: 'CCCD2', UQ_Date: 'Date2', UQ_Noi_Cap: 'Noi_Cap2', UQ_Ngay_Cap: 'Ngay_Cap2', UQ_Address: 'Address1' },
            MEN7: { UQ_Gender: 'Gender7', UQ_Name: 'Name7', UQ_CCCD: 'CCCD7', UQ_Date: 'Date7', UQ_Noi_Cap: 'Noi_Cap7', UQ_Ngay_Cap: 'Ngay_Cap7', UQ_Address: 'Address2' },
          };
          mapping = fallback[source];
        }
        if (mapping) {
          // Điền dữ liệu từ nguồn vào các trường UQ (Bên B - người được ủy quyền)
          Object.entries(mapping).forEach(([uqField, sourceField]) => {
            const sourceValue = data[sourceField];
            if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
              const stringValue = String(sourceValue).trim();
              if (stringValue) {
                data[uqField] = data[sourceField]; // Keep original format (with ":" if exists)
                console.log(`✅ UQ Bên B: ${uqField} = ${data[sourceField]} (từ ${sourceField})`);
              } else {
                console.log(`⚠️ UQ Bên B: ${uqField} = "" (dữ liệu rỗng từ ${sourceField})`);
              }
            } else {
              console.log(`⚠️ UQ Bên B: ${uqField} = "" (không có dữ liệu từ ${sourceField})`);
            }
          });
        }
      }
    } else {
      console.log("⚠️ Không có nguồn dữ liệu UQ Bên B được chọn");
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