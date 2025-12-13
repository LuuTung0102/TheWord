const xmlUtils = {
    escapeXml: function(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },
    normalizePlaceholders: function(text) {
        let result = text;
        for (let i = 0; i < 5; i++) {
            result = result.replace(/\{\{([^}]*)<\/w:t><w:t[^>]*>([^}]*)\}\}/g, '{{$1$2}}');
            result = result.replace(/\{\{([^}]*)<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>([^}]*)\}\}/g, '{{$1$2}}');
            result = result.replace(/\{<\/w:t><w:t[^>]*>\{/g, '{{');
            result = result.replace(/\}<\/w:t><w:t[^>]*>\}/g, '}}');
            result = result.replace(/\{<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>\{/g, '{{');
            result = result.replace(/\}<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>\}/g, '}}');
            result = result.replace(/\{([^{}<]*)<\/w:t><w:t[^>]*>([^{}<]*)\}/g, '{$1$2}');
            result = result.replace(/\{([^{}<]*)<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>([^{}<]*)\}/g, '{$1$2}');
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
    },
    replaceM2: function(text) {
        return text.replace(/(m2)/g, 'm²');
    },
    toTitleCase: function(str) {
        if (!str || typeof str !== 'string') return str;
        return str
          .toLowerCase()
          .split(' ')
          .map(word => {
            if (word.length === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(' ');
    },
    checkRemovalPolicy: function(subgroupsInParagraph, placeholders, options, data) {
         if (!options || !options.phMapping || !options.visibleSubgroups || subgroupsInParagraph.size === 0) {
             return false;
         }
         
         const shouldRemove = Array.from(subgroupsInParagraph).every(subgroupId => {
             const isVisible = options.visibleSubgroups.has(subgroupId);
             const subgroupPhs = placeholders.filter(ph => {
                 const phDef = options.phMapping[ph];
                 return phDef && phDef.subgroup === subgroupId;
             });
             
             if (subgroupPhs.length === 0) {
                 return false;
             }
             
             const allEmpty = subgroupPhs.every(ph => !data[ph] || data[ph].toString().trim() === '');
             return !isVisible && allEmpty;
         });
         
         return shouldRemove;
    },
    replaceM2InXml: function(xml) {
        return xml.replace(/(<w:t[^>]*>)([^<]*?)(m2)([^<]*?)(<\/w:t>)/g, (match, openTag, before, m2, after, closeTag) => {
            return `${openTag}${before}m²${after}${closeTag}`;
        });
    }
};

module.exports = xmlUtils;
