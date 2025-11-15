  const fs = require("fs");
  const PizZip = require("pizzip");
  const Docxtemplater = require("docxtemplater");
  const expressionParser = require("docxtemplater/expressions.js");
  const { getPlaceholders } = require("./placeholder");
  const path = require("path");
  const sax = require("sax");

  function processXmlWithStreaming(xmlString, data, options = {}) {
    return new Promise((resolve, reject) => {
      const parser = sax.createStream(true, { trim: false, normalize: false, lowercase: false });
      let output = [];
      let depth = 0;
      let inParagraph = false;
      let inText = false;
      let paragraphBuffer = [];
      let textBuffer = [];
      let currentTextContent = '';
      let paragraphAttrs = '';
      let textAttrs = '';
      let paragraphHasPlaceholder = false;
      let paragraphTextContent = '';

  
      function escapeXml(str) {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      }

  
      function mergePlaceholders(text) {
        let result = text;
        for (let i = 0; i < 5; i++) {
          result = result.replace(/\{\{([^}]*)<\/w:t><w:t[^>]*>([^}]*)\}\}/g, '{{$1$2}}');
          result = result.replace(/\{\{([^}]*)<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>([^}]*)\}\}/g, '{{$1$2}}');
        }
        result = result.replace(/\{\{[^}]*<[^>]*>[^}]*\}\}/g, (match) => {
          const textContent = match.replace(/<[^>]*>/g, '').replace(/[{}]/g, '');
          if (textContent.trim() && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(textContent.trim())) {
            return `{{${textContent.trim()}}}`;
          }
          return '';
        });
        result = result.replace(/\}\}+}/g, '}}');
        result = result.replace(/\{\{[^a-zA-Z_][^}]*\}\}/g, '');
        result = result.replace(/\{\{[^}]*\s+[^}]*\}\}/g, (match) => {
          const content = match.replace(/[{}]/g, '').trim();
          if (content && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(content)) {
            return `{{${content}}}`;
          }
          return '';
        });
        return result;
      }

      function replaceM2(text) {
        return text.replace(/(m2)/g, 'm²');
      }

      parser.on('opentag', (node) => {
        const tagName = node.name;
        const attrs = Object.keys(node.attributes)
          .map(key => {
            const value = String(node.attributes[key]);
            const escapedValue = value.replace(/"/g, '&quot;');
            return `${key}="${escapedValue}"`;
          })
          .join(' ');
        const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;

        if (tagName === 'w:p') {
          inParagraph = true;
          paragraphBuffer = [];
          paragraphAttrs = attrs;
          paragraphHasPlaceholder = false;
          paragraphTextContent = '';
        } else if (tagName === 'w:t') {
          inText = true;
          textBuffer = [];
          textAttrs = attrs;
          currentTextContent = '';
        }

        if (inParagraph) {
          paragraphBuffer.push(openTag);
        } else {
          output.push(openTag);
        }
        depth++;
      });

      parser.on('text', (text) => {
        if (inText) {
          currentTextContent += text;
          textBuffer.push(text);
        } else if (inParagraph) {
          paragraphBuffer.push(text);
        } else {
          output.push(text);
        }
      });

      parser.on('closetag', (tagName) => {
        depth--;

        if (tagName === 'w:t' && inText) {
          let processedText = currentTextContent;
          processedText = replaceM2(processedText);
          
          const escapedText = processedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          
          const textOutput = textAttrs 
            ? `<w:t ${textAttrs}>${escapedText}</w:t>`
            : `<w:t>${escapedText}</w:t>`;

          if (inParagraph) {
            paragraphBuffer.push(textOutput);
            paragraphTextContent += processedText;
            if (/\{\{[^}]+\}\}/.test(processedText)) {
              paragraphHasPlaceholder = true;
            }
          } else {
            output.push(textOutput);
          }
          
          inText = false;
          textBuffer = [];
          currentTextContent = '';
        } else if (tagName === 'w:p' && inParagraph) {
          const paraContent = paragraphBuffer.join('');
          let processedContent = mergePlaceholders(paraContent);
          
          if (paragraphHasPlaceholder || /\{\{[^}]+\}\}/.test(processedContent)) {
            if (!paragraphAttrs.includes('data-has-placeholder')) {
              paragraphAttrs = paragraphAttrs 
                ? `${paragraphAttrs} data-has-placeholder="true"`
                : 'data-has-placeholder="true"';
            }
          }

          let shouldRemove = false;
          if (options && options.phMapping && options.visibleSubgroups && paragraphHasPlaceholder) {
            const placeholderMatches = processedContent.match(/\{\{([^}]+)\}\}/g);
            if (placeholderMatches) {
              const placeholders = placeholderMatches.map(m => m.replace(/[{}]/g, ''));
              const subgroupsInParagraph = new Set();
              placeholders.forEach(ph => {
                const phDef = options.phMapping[ph];
                if (phDef && phDef.subgroup) {
                  subgroupsInParagraph.add(phDef.subgroup);
                }
              });

              if (subgroupsInParagraph.size > 0) {
                shouldRemove = Array.from(subgroupsInParagraph).every(subgroupId => {
                  const isVisible = options.visibleSubgroups.has(subgroupId);
                  const subgroupPhs = placeholders.filter(ph => {
                    const phDef = options.phMapping[ph];
                    return phDef && phDef.subgroup === subgroupId;
                  });
                  if (subgroupPhs.length === 0) return false;
                  const allEmpty = subgroupPhs.every(ph => !data[ph] || data[ph].toString().trim() === '');
                  return !isVisible && allEmpty;
                });
              }
            }
          }

          if (!shouldRemove) {
            const paraOutput = paragraphAttrs
              ? `<w:p ${paragraphAttrs}>${processedContent}</w:p>`
              : `<w:p>${processedContent}</w:p>`;
            output.push(paraOutput);
          }

          inParagraph = false;
          paragraphBuffer = [];
          paragraphAttrs = '';
          paragraphHasPlaceholder = false;
          paragraphTextContent = '';
        } else {
          if (inParagraph) {
            paragraphBuffer.push(`</${tagName}>`);
          } else {
            output.push(`</${tagName}>`);
          }
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', () => {
        resolve(output.join(''));
      });

      parser.write(xmlString);
      parser.end();
    });
  }

  function cleanupXmlWithStreaming(xmlString) {
    return new Promise((resolve, reject) => {
      const parser = sax.createStream(true, { trim: false, normalize: false, lowercase: false });
      let output = [];
      let inParagraph = false;
      let paragraphBuffer = [];
      let paragraphAttrs = '';
      let paragraphTextNodes = [];
      let inText = false;
      let textAttrs = '';
      let textContent = '';

      parser.on('opentag', (node) => {
        const tagName = node.name;
        const attrs = Object.keys(node.attributes)
          .map(key => `${key}="${String(node.attributes[key]).replace(/"/g, '&quot;')}"`)
          .join(' ');
        const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;

        if (tagName === 'w:p') {
          inParagraph = true;
          paragraphBuffer = [];
          paragraphAttrs = attrs;
          paragraphTextNodes = [];
        } else if (tagName === 'w:t') {
          inText = true;
          textAttrs = attrs;
          textContent = '';
        }

        if (inParagraph) {
          paragraphBuffer.push(openTag);
        } else {
          output.push(openTag);
        }
      });

      parser.on('text', (text) => {
        if (inText) {
          textContent += text;
        } else if (inParagraph) {
          paragraphBuffer.push(text);
        } else {
          output.push(text);
        }
      });

      parser.on('closetag', (tagName) => {
        if (tagName === 'w:t' && inText) {
          const escapedText = textContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          
          const textOutput = textAttrs 
            ? `<w:t ${textAttrs}>${escapedText}</w:t>`
            : `<w:t>${escapedText}</w:t>`;
          
          if (inParagraph) {
            paragraphBuffer.push(textOutput);
            paragraphTextNodes.push(textContent);
          } else {
            output.push(textOutput);
          }
          
          inText = false;
          textContent = '';
        } else if (tagName === 'w:p' && inParagraph) {
          const fullText = paragraphTextNodes.join('');
          const hasPlaceholderTag = paragraphAttrs.includes('data-has-placeholder');
          
          if (hasPlaceholderTag && (/,\s*,\s*(,\s*)+/.test(fullText) || fullText.includes(', ,'))) {
            // Cleanup commas
            const cleanedContent = paragraphBuffer.join('').replace(/<w:t([^>]*)>([^<>&]*)<\/w:t>/g, (textMatch, attrs, content) => {
              if (!content || content.trim().length === 0) {
                return textMatch;
              }
              if (/,\s*,\s*/.test(content)) {
                const cleaned = content.replace(/(,\s*){2,}/g, '');
                return `<w:t${attrs}>${cleaned}</w:t>`;
              }
              return textMatch;
            });
            
            const paraOutput = paragraphAttrs
              ? `<w:p ${paragraphAttrs}>${cleanedContent}</w:p>`
              : `<w:p>${cleanedContent}</w:p>`;
            output.push(paraOutput);
          } else {
            output.push(paragraphBuffer.join('') + '</w:p>');
          }

          inParagraph = false;
          paragraphBuffer = [];
          paragraphAttrs = '';
          paragraphTextNodes = [];
        } else {
          if (inParagraph) {
            paragraphBuffer.push(`</${tagName}>`);
          } else {
            output.push(`</${tagName}>`);
          }
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', () => {
        resolve(output.join(''));
      });

      parser.write(xmlString);
      parser.end();
    });
  }

  async function generateDocx(templatePath, data, outputPath, options = {}) {
    try {
      const stats = fs.statSync(templatePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      const useStreaming = fileSizeInMB > 10;

      const content = fs.readFileSync(templatePath);
      const zip = new PizZip(content);
      try {
        if (zip.files['word/document.xml']) {
          let xml;
          
          if (useStreaming) {
            const originalXml = zip.files['word/document.xml'].asText();
            xml = await processXmlWithStreaming(originalXml, data, options);
          } else {
            xml = zip.files['word/document.xml'].asText();
            
            // Aggressive placeholder merging - run multiple times
            for (let i = 0; i < 10; i++) {
              // Merge across text runs
              xml = xml.replace(/\{\{([^}]*)<\/w:t><w:t[^>]*>([^}]*)\}\}/g, '{{$1$2}}');
              xml = xml.replace(/\{\{([^}]*)<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>([^}]*)\}\}/g, '{{$1$2}}');
              
              // Merge broken single braces
              xml = xml.replace(/\{<\/w:t><w:t[^>]*>\{/g, '{{');
              xml = xml.replace(/\}<\/w:t><w:t[^>]*>\}/g, '}}');
              xml = xml.replace(/\{<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>\{/g, '{{');
              xml = xml.replace(/\}<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>\}/g, '}}');
              
              // Merge content between braces
              xml = xml.replace(/\{([^{}<]*)<\/w:t><w:t[^>]*>([^{}<]*)\}/g, '{$1$2}');
              xml = xml.replace(/\{([^{}<]*)<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>([^{}<]*)\}/g, '{$1$2}');
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
          
          xml = xml.replace(/<w:p\b([^>]*)>([\s\S]*?)<\/w:p>/g, (matchP, attrs, contentP) => {
            const placeholderMatches = contentP.match(/\{\{([^}]+)\}\}/g);
            if (placeholderMatches && placeholderMatches.length > 0) {
              const newAttrs = attrs.includes('data-has-placeholder') 
                ? attrs 
                : `${attrs} data-has-placeholder="true"`;
              return `<w:p${newAttrs}>${contentP}</w:p>`;
            }
            return matchP;
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
          }
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
      
      // Process Loai_Dat_D (land_type_detail)
      if (data.Loai_Dat_D && typeof data.Loai_Dat_D === 'string' && data.Loai_Dat_D.trim()) {
        try {
          const landTypesPath = path.join(__dirname, '..', 'renderer', 'config', 'land_types.json');
          const landTypeMap = JSON.parse(fs.readFileSync(landTypesPath, 'utf8'));
          const entries = data.Loai_Dat_D.split(';').map(e => e.trim()).filter(Boolean);
          
          if (entries.length > 0) {
            const formattedEntries = entries.map((entry, index) => {
              const parts = entry.split('|');
              if (parts.length >= 1) {
                const code = parts[0] ? parts[0].trim() : '';
                const location = parts[1] ? parts[1].trim() : '';
                const area = parts[2] ? parts[2].trim() : '';
                
                if (!code) return '';
                
                const locationPart = location ? `   ${location}` : '';
                const areaPart = area ? `                     Diện tích: ${area}m²` : '';
                
                
                return `\t+ Loại đất ${index + 1}: ${code}:${locationPart}${areaPart}.`;
              }
              return '';
            }).filter(Boolean);
            
            if (formattedEntries.length > 0) {
              // Join with line break (each entry on new line)
              data.Loai_Dat_D = formattedEntries.join('\n');
            } else {
              data.Loai_Dat_D = '';
            }
          } else {
            data.Loai_Dat_D = '';
          }
        } catch (error) {
          console.error('Error processing Loai_Dat_D:', error);
          data.Loai_Dat_D = '';
        }
      } else {
        if (data.Loai_Dat_D !== undefined) {
          data.Loai_Dat_D = '';
        }
      }
      
      const templatePhs = getPlaceholders(templatePath);
      const fullData = {};
      templatePhs.forEach(ph => {
        fullData[ph] = data[ph] !== undefined ? data[ph] : '';
      });
      
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
      
     
      templatePhs.forEach(ph => {
        const nameTMatch = ph.match(/^NameT(\d+)$/);
        if (nameTMatch) {
          const number = nameTMatch[1];
          const baseNamePh = `Name${number}`;
          const baseValue = data[baseNamePh] || fullData[baseNamePh] || '';
          fullData[ph] = toTitleCase(baseValue);
        }
      });
      
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          if (data[key].includes('m2')) {
            data[key] = data[key].replace(/m2/g, 'm²');
          }
          // Check for problematic characters
          if (data[key].includes('{') || data[key].includes('}')) {
            console.warn(`Warning: Field ${key} contains curly braces:`, data[key]);
            data[key] = data[key].replace(/[{}]/g, '');
          }
        }
      });
      Object.keys(fullData).forEach(key => {
        if (typeof fullData[key] === 'string') {
          if (fullData[key].includes('m2')) {
            fullData[key] = fullData[key].replace(/m2/g, 'm²');
          }
          // Check for problematic characters
          if (fullData[key].includes('{') || fullData[key].includes('}')) {
            console.warn(`Warning: Field ${key} contains curly braces:`, fullData[key]);
            fullData[key] = fullData[key].replace(/[{}]/g, '');
          }
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

      try {
        const renderedZip = doc.getZip();
        if (renderedZip.files['word/document.xml']) {
          let xml = renderedZip.files['word/document.xml'].asText();
          
          // Replace {{LINEBREAK}} with Word line break (disabled for now)
          // xml = xml.replace(/\{\{LINEBREAK\}\}/g, '</w:t><w:br/><w:t>');

          if (useStreaming) {
            // Sử dụng streaming cho cleanup
            xml = await cleanupXmlWithStreaming(xml);
          } else {
            // Sử dụng cách cũ cho cleanup
          xml = xml.replace(/<w:p\b([^>]*)>([\s\S]*?)<\/w:p>/g, (match, paraAttrs, paraContent) => {
            if (!paraAttrs.includes('data-has-placeholder')) {
              return match; 
            }

            const textNodes = [];
            paraContent.replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, (m, text) => {
              textNodes.push(text);
            });
            const fullText = textNodes.join('');
            
            if (!/,\s*,\s*(,\s*)+/.test(fullText) && !fullText.includes(', ,')) {
              return match;
            }
            let paraModified = false;
            const cleanedPara = paraContent.replace(/<w:t([^>]*)>([^<>&]*)<\/w:t>/g, (textMatch, attrs, textContent) => {
              if (!textContent || textContent.trim().length === 0) {
                return textMatch;
              }
              if (/,\s*,\s*/.test(textContent)) {
                const cleaned = textContent.replace(/(,\s*){2,}/g, '');
                paraModified = true;
                return `<w:t${attrs}>${cleaned}</w:t>`;
              }
              
              return textMatch;
            });
            
            if (paraModified) {
              return `<w:p${paraAttrs}>${cleanedPara}</w:p>`;
            }
            return match;
          });
          }
          
          renderedZip.file('word/document.xml', xml);
        }
      } catch (cleanupError) {
        console.warn('⚠️ Warning: Comma cleanup failed:', cleanupError.message);
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