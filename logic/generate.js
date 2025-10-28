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
  
    // ===== FUNCTION: BUILD MENx_Ly LINES (Tái sử dụng cho Transfer & Inheritance) =====
    const buildMenLinesGeneric = (indices, options = {}) => {
      const { 
        includeRelation = false,
        includeAddress = false,
        datePrefix = 'sinh ngày:',
        cccdPrefix = 'CCCD số:',
        separator = ', ',
        docType = 'transfer'
      } = options;
      
      indices.forEach(index => {
        const group = `MEN${index}`;
        const relation = includeRelation ? (data[`${group}_Relation`] || "").trim() : "";
        const gender = (data[`Gender${index}`] || "").trim();
        const name = (data[`Name${index}`] || "").trim();
        const birthDate = (data[`Date${index}`] || "").trim();
        const cccd = (data[`CCCD${index}`] || "").trim();
        const issuingPlace = (data[`Noi_Cap${index}`] || "").trim();
        const issuingDate = (data[`Ngay_Cap${index}`] || "").trim();
        const address = includeAddress ? (data[`Address${index}`] || "").trim() : "";
        
        // Check empty
        const hasAny = [relation, gender, name, birthDate, cccd, issuingPlace, issuingDate, address]
          .some(v => v && v.length > 0);
        
        if (!hasAny) {
          // XÓA DÒNG
          data[`${group}_L1`] = "___DELETE_THIS___";
          data[`${group}_L1_Before`] = "___DELETE_THIS___";
          data[`${group}_L1_Name`] = "";
          data[`${group}_L1_After`] = "";
          data[`${group}_L2`] = "___DELETE_THIS___";
          data[`${group}_L3`] = "___DELETE_THIS___";
          data[`${group}_EMPTY`] = true;
          console.log(`🗑️ Removed empty ${group} (${docType})`);
          return;
        }
        
        data[`${group}_EMPTY`] = false;
        
        // BUILD Line 1
        if (includeRelation) {
          // Format cho Inheritance: "Ông: Nguyễn Văn B là con sinh năm 2000"
          data[`${group}_L1_Before`] = gender ? `${gender}: ` : "";
          data[`${group}_L1_Name`] = name;
          data[`${group}_L1_After`] = (relation ? ` là ${relation}` : "") + (birthDate ? ` ${datePrefix} ${birthDate}` : "");
          
          const line1Parts = [];
          if (gender) line1Parts.push(`${gender}:`);
          if (name) line1Parts.push(name);
          if (relation) line1Parts.push(`là ${relation}`);
          if (birthDate) line1Parts.push(`${datePrefix} ${birthDate}`);
          data[`${group}_L1`] = line1Parts.join(" ");
        } else {
          // Format cho Transfer: "Ông Nguyễn Văn B sinh ngày: 2000"
          data[`${group}_L1_Before`] = gender ? `${gender} ` : "";
          data[`${group}_L1_Name`] = name;
          data[`${group}_L1_After`] = birthDate ? ` ${datePrefix} ${birthDate}` : "";
          
          const line1Parts = [];
          if (gender && name) line1Parts.push(`${gender} ${name}`);
          else if (name) line1Parts.push(name);
          if (birthDate) line1Parts.push(`${datePrefix} ${birthDate}`);
          data[`${group}_L1`] = line1Parts.join(" ");
        }
        
        // BUILD Line 2 - CCCD
        const line2Parts = [];
        if (cccd) line2Parts.push(`${cccdPrefix} ${cccd}`);
        if (issuingPlace) line2Parts.push(`do ${issuingPlace}`);
        if (issuingDate) line2Parts.push(`${separator === ', ' ? 'ngày' : 'cấp ngày'} ${issuingDate}`);
        data[`${group}_L2`] = line2Parts.join(separator);
        
        // BUILD Line 3 - Address (chỉ cho inheritance documents)
        if (includeAddress) {
          data[`${group}_L3`] = address ? `Thường trú: ${address}` : "";
        }
      });
    };

    // ===== Transfer Documents: MEN3-6 =====
    buildMenLinesGeneric([3, 4, 5, 6], { 
      includeRelation: false,
      datePrefix: 'sinh ngày:',
      cccdPrefix: 'CCCD số:',
      separator: ', ',
      docType: 'transfer'
    });

    // ===== Phân chia Documents: MEN2-7 (với Relation và Address) =====
    buildMenLinesGeneric([2, 3, 4, 5, 6, 7], { 
      includeRelation: true,
      includeAddress: true,
      datePrefix: 'sinh năm',
      cccdPrefix: 'CCCD số',
      separator: ', ',
      docType: 'phanchia'
    });

    // ===== XÓA DÒNG TRỐNG CHO FATHER/MOTHER (Phân chia documents) =====
    // FATHER
    const fatherName = (data.FATHER_Name || "").trim();
    const fatherDate = (data.FATHER_Date || "").trim();
    const fatherDeathDate = (data.FATHER_Death_Date || "").trim();
    
    if (!fatherName) {
      ['FATHER_Name', 'FATHER_Date', 'FATHER_Death_Date'].forEach(ph => {
        data[ph] = "___DELETE_THIS___";
      });
      data.FATHER_L1 = "___DELETE_THIS___";
      data.FATHER_L1_Before = "___DELETE_THIS___";
      data.FATHER_L1_Name = "";
      data.FATHER_L1_After = "";
      console.log(`🗑️ Removed empty FATHER section`);
    } else {
      // Line 1: "Cha: {name} (sinh {date}, mất {death_date})"
      data.FATHER_L1_Before = "Cha: ";
      data.FATHER_L1_Name = fatherName;
      const afterParts = [];
      if (fatherDate || fatherDeathDate) {
        const dateParts = [];
        if (fatherDate) dateParts.push(`sinh ${fatherDate}`);
        if (fatherDeathDate) dateParts.push(`mất ${fatherDeathDate}`);
        afterParts.push(`(${dateParts.join(", ")})`);
      }
      data.FATHER_L1_After = afterParts.length > 0 ? ` ${afterParts.join(" ")}` : "";
      
      const line1Parts = ["Cha:", fatherName];
      if (fatherDate || fatherDeathDate) {
        const dateParts = [];
        if (fatherDate) dateParts.push(`sinh ${fatherDate}`);
        if (fatherDeathDate) dateParts.push(`mất ${fatherDeathDate}`);
        line1Parts.push(`(${dateParts.join(", ")})`);
      }
      data.FATHER_L1 = line1Parts.join(" ");
    }

    // MOTHER
    const motherName = (data.MOTHER_Name || "").trim();
    const motherDate = (data.MOTHER_Date || "").trim();
    const motherDeathDate = (data.MOTHER_Death_Date || "").trim();
    
    if (!motherName) {
      ['MOTHER_Name', 'MOTHER_Date', 'MOTHER_Death_Date'].forEach(ph => {
        data[ph] = "___DELETE_THIS___";
      });
      data.MOTHER_L1 = "___DELETE_THIS___";
      data.MOTHER_L1_Before = "___DELETE_THIS___";
      data.MOTHER_L1_Name = "";
      data.MOTHER_L1_After = "";
      console.log(`🗑️ Removed empty MOTHER section`);
    } else {
      // Line 1: "Mẹ: {name} (sinh {date}, mất {death_date})"
      data.MOTHER_L1_Before = "Mẹ: ";
      data.MOTHER_L1_Name = motherName;
      const afterParts = [];
      if (motherDate || motherDeathDate) {
        const dateParts = [];
        if (motherDate) dateParts.push(`sinh ${motherDate}`);
        if (motherDeathDate) dateParts.push(`mất ${motherDeathDate}`);
        afterParts.push(`(${dateParts.join(", ")})`);
      }
      data.MOTHER_L1_After = afterParts.length > 0 ? ` ${afterParts.join(" ")}` : "";
      
      const line1Parts = ["Mẹ:", motherName];
      if (motherDate || motherDeathDate) {
        const dateParts = [];
        if (motherDate) dateParts.push(`sinh ${motherDate}`);
        if (motherDeathDate) dateParts.push(`mất ${motherDeathDate}`);
        line1Parts.push(`(${dateParts.join(", ")})`);
      }
      data.MOTHER_L1 = line1Parts.join(" ");
    }

    const landParts = [];
    Object.keys(data).forEach(key => {
      if (key.startsWith('S_') && key !== 'S_Text' && key !== 'S_Chung') {
        const value = data[key];
        if (value && value.toString().trim() !== "" && value !== "0") {
          // Lấy mã loại đất từ key (ví dụ: S_ONT -> ONT)
          const landCode = key.replace('S_', '');
          landParts.push(`${value}m²: ${landCode}`);
      } else {
          data[key] = "";  
        }
      }
    });
    

    data.Loai_Dat_Full = landParts.join('; ');
    
    console.log(`📊 Mục đích sử dụng: ${data.Loai_Dat_Full || '(trống)'}`);
    console.log(`📊 Tìm thấy ${landParts.length} loại đất có diện tích`);
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
      if (!mapping) {
        const fallback = {
          MEN1: { BD_Gender: 'Gender1', BD_Name: 'Name1', BD_CCCD: 'CCCD1', BD_Date: 'Date1', BD_Noi_Cap: 'Noi_Cap1', BD_Ngay_Cap: 'Ngay_Cap1', BD_SDT: 'SDT_MEN1', BD_Address: 'Address1', BD_Email: 'EMAIL_MEN1' },
          MEN7: { BD_Gender: 'Gender7', BD_Name: 'Name7', BD_CCCD: 'CCCD7', BD_Date: 'Date7', BD_Noi_Cap: 'Noi_Cap7', BD_Ngay_Cap: 'Ngay_Cap7', BD_SDT: 'SDT_MEN7', BD_Address: 'Address7', BD_Email: 'EMAIL_MEN7' },
        };
        mapping = fallback[source];
      }
      if (mapping) {
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
          MEN7: { UQA_Gender: 'Gender7', UQA_Name: 'Name7', UQA_CCCD: 'CCCD7', UQA_Date: 'Date7', UQA_Noi_Cap: 'Noi_Cap7', UQA_Ngay_Cap: 'Ngay_Cap7', UQA_Address: 'Address7' },
        };
        mapping = fallback[source];
      }
      if (mapping) {
        Object.entries(mapping).forEach(([uqaField, sourceField]) => {
          const sourceValue = data[sourceField];
          if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
           
            const stringValue = String(sourceValue).trim();
            if (stringValue) {
              data[uqaField] = data[sourceField]; 
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
    
   
    if (data.selectedUQBenBDataSource) {
      const source = data.selectedUQBenBDataSource;
      if (source.startsWith('DEFAULT')) {
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
          data.UQ_Gender = defaultPeopleData.gender;
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
            MEN7: { UQ_Gender: 'Gender7', UQ_Name: 'Name7', UQ_CCCD: 'CCCD7', UQ_Date: 'Date7', UQ_Noi_Cap: 'Noi_Cap7', UQ_Ngay_Cap: 'Ngay_Cap7', UQ_Address: 'Address7' },
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

    // ✅ buildMenLines đã được thay bằng buildMenLinesGeneric ở trên

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