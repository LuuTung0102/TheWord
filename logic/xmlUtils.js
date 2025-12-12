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
    }
};

module.exports = xmlUtils;
